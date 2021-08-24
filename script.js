// Navigation link elements
const HOME_LINK = document.getElementById("home-link")
const SKILLS_LINK = document.getElementById("skills-link")
const PROJECTS_LINK = document.getElementById("projects-link")

// Content div elements
const HOME_CONTENT = document.getElementById("title")
const SKILLS_CONTENT = document.getElementById("skills")
const PROJECTS_CONTENT = document.getElementById("projects")




// Register click handlers for each navigation element.
HOME_LINK.addEventListener('click', event => {
    HOME_CONTENT.style.display = 'block';
    SKILLS_CONTENT.style.display = 'none';
    PROJECTS_CONTENT.style.display = 'none';

    // Assign active property to link 
    HOME_LINK.classList.add('selected')
    SKILLS_LINK.classList.remove('selected')
    PROJECTS_LINK.classList.remove('selected')
});

SKILLS_LINK.addEventListener('click', event => {
    HOME_CONTENT.style.display = 'none';
    SKILLS_CONTENT.style.display = 'block';
    PROJECTS_CONTENT.style.display = 'none';

        // Assign active property to link 
        HOME_LINK.classList.remove('selected')
        SKILLS_LINK.classList.add('selected')
        PROJECTS_LINK.classList.remove('selected')
});

PROJECTS_LINK.addEventListener('click', event => {
    HOME_CONTENT.style.display = 'none';
    SKILLS_CONTENT.style.display = 'none';
    PROJECTS_CONTENT.style.display = 'block';

        // Assign active property to link 
        HOME_LINK.classList.remove('selected')
        SKILLS_LINK.classList.remove('selected')
        PROJECTS_LINK.classList.add('selected')
});