// Dark mode toggle functionality
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeIcon = document.getElementById('darkModeIcon');
        const body = document.body;
        
        // Initialize dark mode state
        const isDarkModeEnabled = localStorage.getItem('dark-mode') === 'true'; // Check localStorage
        const prefersDarkMode = matchMedia('(prefers-color-scheme: dark)').matches; // Check system preference
        
        if (isDarkModeEnabled) {
          // Apply dark mode if the user explicitly enabled it
          body.classList.add('dark-mode');
          darkModeToggle.classList.add('dark');
          darkModeIcon.src = "https://neal.fun/infinite-craft/dark-mode-on.svg"; // Set dark mode icon
        } else {
          // Default to light mode
          body.classList.remove('dark-mode');
          darkModeIcon.src = "https://neal.fun/infinite-craft/dark-mode.svg"; // Set light mode icon
        }
        
        // Add event listener to toggle dark mode
        darkModeToggle.addEventListener('click', () => {
          const isDarkMode = body.classList.toggle('dark-mode');
          darkModeIcon.src = isDarkMode
            ? "https://neal.fun/infinite-craft/dark-mode-on.svg" // Dark mode icon
            : "https://neal.fun/infinite-craft/dark-mode.svg";   // Light mode icon
          darkModeToggle.classList.toggle('dark', isDarkMode);
        
          // Save the current dark mode state to localStorage
          localStorage.setItem('dark-mode', isDarkMode);
        });


        // Canvas and context setup
        const canvas = document.getElementById("background");
        const ctx = canvas.getContext("2d");
        let dots = [];


        // Resize canvas and reposition existing dots
        function resizeCanvas() {
            const oldWidth = canvas.width;
            const oldHeight = canvas.height;


            // Update canvas dimensions
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;


            // Reposition dots proportionally to new size
            dots.forEach(dot => {
                dot.x = (dot.x / oldWidth) * canvas.width;
                dot.y = (dot.y / oldHeight) * canvas.height;
            });
        }


        // Generate a random shade of gray
        function randomGray() {
            const value = Math.floor(Math.random() * 151) + 100; // Random value between 100 and 255
            return `rgb(${value}, ${value}, ${value})`;
        }


        // Create dots with random positions, velocities, and colors
        function createDots() {
          const numDots = 60; // Number of dots
          dots = Array.from({ length: numDots }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2.1 + 1.5, // Random radius between 1.5 and 2.1
            color: randomGray(),
          }));
        }
              
        // Function to get the current base line color
        function getLineColorBase() {
          return getComputedStyle(document.body).getPropertyValue('--line-color-base').trim();
        }
        
        function getCanvasBackgroundColor() {
          return getComputedStyle(document.body).getPropertyValue('--canvas-background').trim();
        }


        // Draw dots and connecting lines
        function drawDots() {
            const canvasBackgroundColor = getCanvasBackgroundColor();
            ctx.fillStyle = canvasBackgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear the canvas with the current background color


            // Draw each dot
            dots.forEach(dot => {
                dot.x += dot.vx;
                dot.y += dot.vy;


                if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
                if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;


                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fillStyle = dot.color;
                ctx.fill();
            });
            
            // Get the current base line color
            const lineColorBase = getLineColorBase();


            // Draw lines between close dots
            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const dx = dots[i].x - dots[j].x;
                    const dy = dots[i].y - dots[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);


                    if (distance < 80) {
                        // Calculate opacity based on distance
                        const opacity = 1 - distance / 80;


                        // Create a dynamic line color with adjusted opacity
                        const lineColor = lineColorBase.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${opacity})`);
                        
                        ctx.beginPath();
                        ctx.moveTo(dots[i].x, dots[i].y);
                        ctx.lineTo(dots[j].x, dots[j].y);
                        ctx.strokeStyle = lineColor;
                        ctx.stroke();
                    }
                }
            }
        }


        // Animation loop
        function animate() {
            drawDots();
            requestAnimationFrame(animate);
        }
        
        // window.addEventListener("scroll", () => {
        // const scrollHeight = document.body.scrollHeight;
        // const scrollTop = window.scrollY + window.innerHeight;


        // Add more dots when near the bottom of the page
        // if (scrollTop + 100 >= scrollHeight) {
        //     createDots(20); // Add 20 new dots
        //     resizeCanvas(); // Adjust canvas height dynamically
        //   }
        // });


        // Initialize canvas animation
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        createDots();
        animate();


        // File input customization
        const fileInput = document.getElementById('fileInput');
        const uploadButton = document.getElementById('uploadButton');
        const fileNameDisplay = document.getElementById('fileName');


        // Open file dialog when custom button is clicked
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });


        // Display file name after selecting a file
        fileInput.addEventListener('change', function() {
            const file = fileInput.files[0];
            if (file) {
                fileNameDisplay.textContent = file.name;
            } else {
                fileNameDisplay.textContent = "No file selected";
            }
        });


        // File handling and editor functionality
        const editor = document.getElementById('editor');
        const addRowButton = document.getElementById('addRow');
        const exportButton = document.getElementById('exportJson');
        const searchQuery = document.getElementById('searchBar');
        let jsonData = {};
        let originalFileName = "updated_file.ic";


        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                originalFileName = file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const compressedData = new Uint8Array(e.target.result);
                        const decompressedData = pako.inflate(compressedData, { to: 'string' });
                        jsonData = JSON.parse(decompressedData);
                        if (jsonData.items && Array.isArray(jsonData.items)) {
                            renderItemsEditor(jsonData.items);


                            // Show the buttons after a file is loaded
                            addRowButton.classList.remove('hidden');
                            exportButton.classList.remove('hidden');
                            searchQuery.classList.remove('hidden');
                        } else {
                            editor.innerHTML = `<p>No valid <code>items</code> array found in the JSON.</p>`;
                        }
                    } catch (error) {
                        editor.innerHTML = `<p>Error during decompression or parsing: ${error.message}</p>`;
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });
        
        let filteredItems = []; // Temporary storage for filtered items
        
        // Render items in the editor
        function renderItemsEditor(items) {
          editor.innerHTML = ""; // Clear the editor content
          items.forEach((item, index) => {
              const block = document.createElement("div");
              block.className = "item-block";
              block.setAttribute("data-index", index);
      
              // Create the item HTML with the toggle switch for "discovery"
              block.innerHTML = `
                  <div class="item-id">ID: ${item.id}</div>
                  <input type="text" value="${item.text}" class="item-text" />
                  <input type="text" value="${item.emoji}" class="item-emoji" maxlength="2" />
                  <div class="discovery-container">
                      <label class="toggle-switch">
                          <input type="checkbox" class="discovery-checkbox" ${
                              item.discovery ? "checked" : ""
                          } />
                          <span class="slider"></span>
                      </label>
                      <span class="discovery-label">Discovery</span>
                  </div>
                  <button class="delete-button">Delete</button>
              `;
      
              // Update the item text when modified
              block.querySelector(".item-text").addEventListener("input", () => {
                  const itemIndex = jsonData.items.findIndex(i => i.id === item.id);
                  if (itemIndex !== -1) {
                      jsonData.items[itemIndex].text = block.querySelector(".item-text").value;
                  }
              });
      
              // Update the item emoji when modified
              block.querySelector(".item-emoji").addEventListener("input", () => {
                  const itemIndex = jsonData.items.findIndex(i => i.id === item.id);
                  if (itemIndex !== -1) {
                      jsonData.items[itemIndex].emoji = block.querySelector(".item-emoji").value;
                  }
              });
      
              // Handle the toggle switch for "discovery"
              block.querySelector(".discovery-checkbox").addEventListener("change", (event) => {
                  const isChecked = event.target.checked;
                  const itemIndex = jsonData.items.findIndex(i => i.id === item.id);
                  if (itemIndex !== -1) {
                      if (isChecked) {
                          // Add "discovery": true to the item
                          jsonData.items[itemIndex].discovery = true;
                      } else {
                          // Remove "discovery" from the item
                          delete jsonData.items[itemIndex].discovery;
                      }
                  }
              });
      
              // Handle deleting the row
              block.querySelector(".delete-button").addEventListener("click", () => deleteRow(item.id));
      
              editor.appendChild(block);
          });
        }


        function updateJsonFromEditor() {
            const blocks = document.querySelectorAll(".item-block");
            jsonData.items = Array.from(blocks).map((block, index) => ({
                id: index,
                text: block.querySelector(".item-text").value,
                emoji: block.querySelector(".item-emoji").value,
            }));
        }


        function deleteRow(index) {
            jsonData.items.splice(index, 1);
            jsonData.items = jsonData.items.map((item, i) => ({ ...item, id: i }));
            renderItemsEditor(jsonData.items);
        }


        addRowButton.addEventListener("click", () => {
          const nextId = jsonData.items.length;
          jsonData.items.push({ id: nextId, text: "New Item", emoji: "🆕" });
          renderItemsEditor(jsonData.items);
      
          // Focus on the newly created item's text input field
          const newItemBlock = document.querySelector(`.item-block[data-index="${nextId}"]`);
          if (newItemBlock) {
              const newItemTextInput = newItemBlock.querySelector(".item-text");
              if (newItemTextInput) {
                  newItemTextInput.focus();
                  // Move the caret to the end of the text
                  const textLength = newItemTextInput.value.length;
                  newItemTextInput.setSelectionRange(textLength, textLength);
              }
          }
        });


        exportButton.addEventListener("click", () => {
            try {
                const updatedJson = JSON.stringify({ ...jsonData, updated: Date.now() }, null, 2);
                const compressedData = pako.gzip(updatedJson);
                const blob = new Blob([compressedData], { type: "application/gzip" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = originalFileName;
                link.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error exporting .ic file:", error.message);
            }
        });
        
        // Search functionality
        searchBar.addEventListener("input", () => {
            const query = searchBar.value.toLowerCase().trim();
        
            // If the search query is empty, show all items (reset search)
            if (query === "") {
                resetSearch();
            } else {
                // Filter items for the search query
                filteredItems = jsonData.items.filter(item =>
                    item.text.toLowerCase().includes(query) ||
                    item.emoji.toLowerCase().includes(query)
                );
                renderItemsEditor(filteredItems); // Display only filtered items
            }
        });
        
        // Function to reset the search bar and re-render all items
        function resetSearch() {
            searchBar.value = ""; // Clear the search bar
            filteredItems = []; // Clear the filtered items
            renderItemsEditor(jsonData.items); // Re-render all items
        }
        
        // Delete a row by item ID
        function deleteRow(id) {
            // Remove item from the original dataset
            jsonData.items = jsonData.items.filter(item => item.id !== id);
        
            // Update the filtered items, if a search is active
            if (filteredItems.length > 0) {
                filteredItems = filteredItems.filter(item => item.id !== id);
            }
        
            // Re-render the current view (filtered or all items)
            const itemsToRender = filteredItems.length > 0 ? filteredItems : jsonData.items;
            renderItemsEditor(itemsToRender);
        }
        
        const nameEditor = document.getElementById('nameEditor');
        const nameInput = document.getElementById('nameInput');
    
        // Show the name editor when a file is loaded
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                originalFileName = file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const compressedData = new Uint8Array(e.target.result);
                        const decompressedData = pako.inflate(compressedData, { to: 'string' });
                        jsonData = JSON.parse(decompressedData);
    
                        if (jsonData.name) {
                            nameInput.value = jsonData.name; // Populate the name input with the current value
                            nameEditor.classList.remove('hidden'); // Show the name editor
                        }
    
                        if (jsonData.items && Array.isArray(jsonData.items)) {
                            renderItemsEditor(jsonData.items);
    
                            // Show the buttons after a file is loaded
                            addRowButton.classList.remove('hidden');
                            exportButton.classList.remove('hidden');
                            searchQuery.classList.remove('hidden');
                        } else {
                            editor.innerHTML = `<p>No valid <code>items</code> array found in the JSON.</p>`;
                        }
                    } catch (error) {
                        editor.innerHTML = `<p>Error during decompression or parsing: ${error.message}</p>`;
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });
    
        // Update the JSON when the name is edited
        nameInput.addEventListener('input', () => {
            jsonData.name = nameInput.value; // Update the JSON's name property
        });
        
        const createSaveButton = document.getElementById('createSaveButton');


        createSaveButton.addEventListener('click', () => {
          // Get the current timestamp in milliseconds
          const currentTimestamp = Date.now();
          
          // Base save structure with the specified elements and metadata
          jsonData = {
            name: "New Save",
            version: "1.0",
            created: currentTimestamp,       // Current UNIX timestamp in milliseconds
            updated: 0,                      // Initially set to 0
            instances: [],                   // Empty array for instances
            items: [
              { id: 0, text: "Water", emoji: "💧" },
              { id: 1, text: "Fire", emoji: "🔥" },
              { id: 2, text: "Wind", emoji: "🌬️" },
              { id: 3, text: "Earth", emoji: "🌍" }
            ]
          };
        
          // Render the base save in the editor
          renderItemsEditor(jsonData.items);
        
          // Show the buttons and name editor for the newly created save
          document.getElementById('nameEditor').classList.remove('hidden');
          document.getElementById('addRow').classList.remove('hidden');
          document.getElementById('exportJson').classList.remove('hidden');
          document.getElementById('searchBar').classList.remove('hidden');
        
          // Set the name input to the base save's name
          const nameInput = document.getElementById('nameInput');
          nameInput.value = jsonData.name;
        });
