​	

# Introduction to Minecraft Modding

If you have played modded Minecraft before, you are probably familiar with the concept of mod loaders.

​	Forge has been the dominant Minecraft mod loader for quite a few years at this point, and you can basically be guaranteed any pack below 1.13 runs on it. Fabric is a new mod loader that was officially unveiled during the 1.14 snapshot period, and has slowly risen to a point where it is a popular choice for 1.16 users But what separates the two? Why would I choose one over the other, as a user or as a developer?

To start, we have to look at what a mod is.

### Class Files and Decompilation

​	Minecraft is written in Java. One of the unique characteristics of Java is how programs are packaged and shipped to users, generally through .jar files. Take a simple program written in Java, say, *"Hello, world"*:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
```

This class is stored in a .java file during development, but when you want to execute it or ship it to users, you have to compile it into *Java bytecode*, which is stored in .class files. Here is the same *"Hello, world!"* example in bytecode:

```java
// class version 52.0 (52)
// access flags 0x21
public class Main {

  // compiled from: Main.java

  // access flags 0x1
  public <init>()V
   L0
    LINENUMBER 1 L0
    ALOAD 0
    INVOKESPECIAL java/lang/Object.<init> ()V
    RETURN
   L1
    LOCALVARIABLE this LMain; L0 L1 0
    MAXSTACK = 1
    MAXLOCALS = 1

  // access flags 0x9
  public static main([Ljava/lang/String;)V
   L0
    LINENUMBER 4 L0
    GETSTATIC java/lang/System.out : Ljava/io/PrintStream;
    LDC "Hello, world!"
    INVOKEVIRTUAL java/io/PrintStream.println (Ljava/lang/String;)V
   L1
    LINENUMBER 5 L1
    RETURN
   L2
    LOCALVARIABLE args [Ljava/lang/String; L0 L2 0
    MAXSTACK = 2
    MAXLOCALS = 1
}

```

 When you get a .jar bundle, you are basically receiving a zip of .class files and other resources needed to run an application. 

​	Here's the important part: *the process of compiling to Java bytecode can be reversed*. This is why IDEs like IntelliJ can open .class files and show you a rough estimation at what the original source code was, despite it not directly existing in the .class file. This does ring true for a few other languages, but for most languages used for game development, such as C++, the process is not anywhere near as straightforward. 

​	This means games like Minecraft can be "decompiled," modified, recompiled, and then sent out to friends. The problem is that this is illegal several times over, and distributing modified copies of the game is a good way to get a few lawyers coming after you. It *also* means you can view the Minecraft source code *without directly editing it* while not getting in trouble, which is why it is useful for mod creators. To get around the issue of not being able to redistribute modified game files, mod loaders do things like applying patches on top of existing installations, or modifying game bytecode using ASM/Mixin.

### Obfuscation

​	There is another piece to this complicated puzzle: obfuscation. To combat the issue of people decompiling, modifying, and re-compiling Minecraft code (as well as to avoid a couple other issues), Mojang *obfuscates* Minecraft game code before shipping it out. Take the following example, which is not practical, or usable, or realistic in any sense:

```java
public class Main {
    public static void main(String[] args) {
        Creeper creeper = new Creeper();
        creeper.explode();
    }
}
```

When the game is shipped, the code might look more like this:

```java
public class D {
    public static void main(String[] args) {
        A a = new A();
        a.bc();
    }
}
```

Confusing and impossible to read, right? That is a __mission accomplished__ for the company shipping out code. People cracking into the base game jar will have a very hard time figuring out what is what when everything is so jumbled!

### Mappings

​	This is where mappings step in. Mappings are a collection of names for obfuscated code. Some people also refer to the base obfuscated code as a set of mappings, specifically "Notch," mappings, but the term is generally used to describe a set of readable phrases that are used to replace obfuscated names. Mappings are usually run and managed by modding communities, and in some rare cases, supported by developers. In this case, a modder might realize the class is being created inside a spawn egg item, and eventually infer this is a Creeper. The modder can then say, "A should be Creeper!" 

​	Unfortunately, it is still not that simple. Obfuscated mappings change every time a new version of Minecraft is released, which means "A" might be "D" the next update. This is where the second step comes in, which is referred to as intermediary in the Fabric ecosystem, and SRG (Searge) in Forge. This step, which I will refer to as "intermediary mappings," from now on, is a set of still-semi-obfuscated mappings that do not change between releases. This is what you see in a crash log while running a mod loader in a vanilla client, or what you see in a development environment when names are not mapped. The same example from above might be more like:

```java
public class class_153 {
    public static void main(String[] args) {
        class_5814 a = new class_5814();
        a.method_963();
    }
}
```

class_153 will always be class_153 in this case, so we can confidently map it to a real name like "MyClass," without worrying about it changing in the next game update. Obfuscated names are mapped to intermediary names with a set of tools that can track name changes between versions, and an occasional manual touchup when things don't line up perfectly.

​	Aside from SRG and Intermediary, the three primary mappings sets you need to be aware of are MCP, Yarn, and Mojmap. MCP, or Minecraft Coder Pack, is one of the original Minecraft mapping sets that Forge still uses today. Yarn is a newer mapping set used by Fabric licensed as public domain, and Mojmap is the name coined for official Minecraft mappings from Mojang. From a completion standpoint, Yarn is much more complete than MCP in 1.16 despite the age difference, with almost every class, field, and method mapped, while Mojmap has all the original mappings (~= 100%), but lacks parameter names in methods, making it not truly as complete as Yarn.

​	While developing mods in an IDE, the game will be mapped with your choice of mappings. Once the mod is exported and used in production (a vanilla client), the names will be in intermediary. 

### Mod Loaders

​	A few names have been thrown around at this point, so let's clarify: Mod Loaders bundle mod loading, game hooks, mappings, and much more into a core package. You build a mod, often utilizing the hooks provided by a mod loader or mod API, and users place it into their mods folder, which is then loaded by mod loaders installed on top of Minecraft installations. 

​	Major loader recap: Forge is an API and mod launcher: it provides all the capabilities needed for interfacing with Minecraft and loading modifications from a mods folder. Most Forge modders rely on the Minecraft Coder Pack for mappings. Fabric provides the same functionality, but separates it into 2 different projects: Fabric Loader is a game and version-independent mod loader, while Fabric API provides hooks for interfacing with Minecraft. Fabric developers generally use Yarn for mappings.

​	Several other mod loaders have popped up in the past, such as Liteloader and Rift (the latter of which was a large inspiration for Fabric), but the main loader meta is Fabric and Forge at the moment.

### Why use Fabric or Forge?

​	Fabric vs. Forge is a little bit like Apple vs. Android. Both sides will tell you their side is the best and that the other side is bad. I lean hard Fabric, but I will attempt to keep my bias down as I explain the differences between these two loaders.

​	From a purpose standpoint, Forge attempts to be a grand mothership that covers anything and everything related to modding. If you need to do something, Forge has a hook or API for it. System for managing energy inside blocks? Check. Hooks for manipulating obscure game mechanics? Check. Events for any interaction you can think of? Check. Forge has a very clear point of view on how they expect you to implement things: you do it through their API and follow a specific set of rules to get it done. The benefit of this system is that the user rarely has to interface directly with Minecraft code, as everything is abstracted. 

​	Unfortunately, this desire to control and manage how people mod makes the experience not as much of a sandbox as some would like. Providing as many hooks as they do also impacts game performance, and some may argue Forge infringes too much on the base experience of Minecraft (one example of this is how they directly change the loading screen, or how the mod menu is not optional). Any user who has loaded a modpack on Forge and Fabric will see a clear loading speed difference (my personal experience has lead me to expect ~3-4 minutes loading time for Forge packs, and <1 minute loading time for Fabric packs with a similar amount of content).

​	The Forge development community is also seen as fairly toxic. Fabric's community isn't perfect, but I invite you to head to the Forge development forums and speed run finding a post where a well-known developer is sassing a new developer asking a simple question. Hint: it won't take long. This stems down from behavior higher up the development chain, which should be as clear as day to anyone who has modded for more than a day. 

​	The original developers of Fabric wanted to escape from these restrictions and build something truly free. Fabric doesn't attempt to take over the game: it just provides the *base* hooks and mechanics needed for modding compatibility. This means fast loading speeds, fast update times between versions, and the freedom to do whatever in the world you want. For reference, Fabric was able to update to 1.15 and 1.16 within a day of them being released (and kept up with every snapshot within several hours of release). Forge was not on 1.13 *until Fabric was on 1.14*. If you want to play bleeding edge, Fabric is the way to go.

​	Fabric encourages mixins, which allows developers to interact with and manipulate the base game as much as they want to. Forge only recently un-demonized mixins by adding minimal support for them, but it is still not truly supported when you ask about it in any Forge community. 

​	The biggest critique of Fabric is that it lacks hooks and capabilities, but that is one of the sacrifices needed for insanely fast update times and loading speeds. Developers can still make hooks for anything they need through mixins, and I can basically count the remaining number of things Fabric API lacks on one hand. 

​	It should be clear at this point that I prefer Fabric, but this is a Fabric tutorial, so I hope that is not a major surprise. :)

### Game Lifecycle

​	Now that we have established what mod loaders are, the basics of how they work, and what options you have, we need to look at what the game looks like from a lifecycle perspective. All examples from this point on will be in Fabric, but similar concepts apply in Forge.

​	When you run your game, a large amount of setup occurs to load content, prepare textures & assets, sort items and other content, and prepare the game for you. This is what you see while the game is loading (sorry, Fabric loads so fast that I can't screenshot the loading bar before 50%):

![Minecraft Loading Screen](/docs/assets/images/minecraft_loading.png)

​		We will cover this more in the future, but for now, just know that Minecraft is split into two main parts: the client and server. Both have a `Main` class with a `public static void main` method that kicks off loading for those sections. Mod loaders add hooks into the loading process-- around 25% up the loading bar-- which allows you to run code while the game is loading. This includes doing things like registering new content (items, blocks, entities), reading config files, loading assets, or printing "Hello, world" messages to console... which is what we are about to do.

​	Here is a basic Fabric mod initializer class. As mentioned previously, it is loaded some time during the game's "initialization phase." More specifically, the `onInitialize` method for any registered initializer is called around this time:

```java
import net.fabricmc.api.ModInitializer;

public class MyModInitializer implements ModInitializer {
    
    @Override
    public void onInitialize() {
        
    }
}
```

​	Just like the client and server split, we will talk more about the concept of "registering content," later, but most things you do to prepare your mod should be triggered by this `onInitialize` method. How about we make it print "Hello, world," for now?

```java
@Override
public void onInitialize() {
    System.out.println("Hello, world!");
}
```

​	Run the game...

```
[14:23:26] [main/INFO] (Minecraft) Setting user: Player834
[14:23:26] [main/INFO] (Minecraft) [STDOUT]: Hello, world!
[14:23:26] [main/INFO] (Indigo) [Indigo] Registering Indigo renderer!
[14:23:26] [main/INFO] (Minecraft) Backend library: LWJGL version 3.2.2 build 10
[14:23:28] [main/INFO] (Minecraft) Narrator library for x64 successfully loaded
```

​	Our line has been printed! You could even bundle up this mod, send it to your friends, and let them bask in the light of your print statement if you really wanted to at this point.

### Conclusion

​	In conclusion, we talked about the ability to manipulate compiled Java applications, obfuscation, mappings, mod loaders, which loader you should choose, and how to print "Hello, world," to the console with a simple Fabric mod. In the next lesson, we will talk about registries, and how to let the game know our custom content exists. 

​	I hope you enjoyed this lesson, and I hope to see you in the next lesson!