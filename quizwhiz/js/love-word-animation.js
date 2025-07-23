/** 
 * This script finds every element with the class 'love-word' and dynamically 
 * adds decorative SVG hearts around it. 
 */ 
document.addEventListener('DOMContentLoaded', function() { 
    // The SVG path for a single heart icon with gradient. 
    const heartSVG = ` 
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> 
            <defs>
                <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fe015c" /> <!-- Dark pink -->
                    <stop offset="100%" stop-color="#ff7ccc" /> <!-- Light pink -->
                </linearGradient>
            </defs>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/> 
        </svg> 
    `; 

    // Configuration for where to place the hearts. 
    const heartPositions = [ 
        // A larger heart on the top-left 
        { top: '-10%', left: '-5%', transform: 'rotate(-25deg) scale(1.5)', animationDelay: '0s' }, 
        // A smaller heart overlapping the large one 
        { top: '-40%', left: '30%', transform: 'rotate(20deg) scale(0.9)', animationDelay: '0.3s' }, 
        // Top-right heart 
        { top: '-10%', left: '85%', transform: 'rotate(25deg) scale(1.2)', animationDelay: '0.1s' }, 
        // Bottom-left heart 
        { top: '50%', left: '-15%', scale: '0.1', transform: 'rotate(-35deg) scale(0.9)', animationDelay: '0.4s' }, 
        // Bottom-right heart 
        { top: '65%', left: '70%', transform: 'rotate(30deg) scale(1.3)', animationDelay: '0.2s' }, 
    ]; 

    // Find all instances of the '.love-word' span. 
    const loveWords = document.querySelectorAll('.love-word'); 

    // Iterate over each found word. 
    loveWords.forEach(wordElement => { 
        // For each configured position, create and append a heart. 
        heartPositions.forEach(pos => { 
            const heartContainer = document.createElement('div'); 
            heartContainer.className = 'heart-container'; 
            heartContainer.innerHTML = heartSVG; 

            // Apply the unique styles for this specific heart. 
            heartContainer.style.top = pos.top; 
            heartContainer.style.left = pos.left; 
            heartContainer.style.transform = pos.transform; 
            heartContainer.style.animationDelay = pos.animationDelay; 
            
            // Add the heart to the DOM, inside the 'love-word' span. 
            wordElement.appendChild(heartContainer); 
        }); 
    }); 
});