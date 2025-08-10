        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeIcon = document.getElementById('darkModeIcon');
        const body = document.body;

        const isDarkModeEnabled = localStorage.getItem('dark-mode') === 'true'; 
        const prefersDarkMode = matchMedia('(prefers-color-scheme: dark)').matches; 

        if (isDarkModeEnabled) {

          body.classList.add('dark-mode');
          darkModeToggle.classList.add('dark');
          darkModeIcon.src = "https://neal.fun/infinite-craft/dark-mode-on.svg"; 
        } else {

          body.classList.remove('dark-mode');
          darkModeIcon.src = "https://neal.fun/infinite-craft/dark-mode.svg"; 
        }

        darkModeToggle.addEventListener('click', () => {
          const isDarkMode = body.classList.toggle('dark-mode');
          darkModeIcon.src = isDarkMode
            ? "https://neal.fun/infinite-craft/dark-mode-on.svg" 
            : "https://neal.fun/infinite-craft/dark-mode.svg";   
          darkModeToggle.classList.toggle('dark', isDarkMode);

          localStorage.setItem('dark-mode', isDarkMode);
        });

        const canvas = document.getElementById("background");
        const ctx = canvas.getContext("2d");
        let dots = [];

        function resizeCanvas() {
            const oldWidth = canvas.width;
            const oldHeight = canvas.height;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            dots.forEach(dot => {
                dot.x = (dot.x / oldWidth) * canvas.width;
                dot.y = (dot.y / oldHeight) * canvas.height;
            });
        }

        function randomGray() {
            const value = Math.floor(Math.random() * 151) + 100; 
            return `rgb(${value}, ${value}, ${value})`;
        }

        function createDots() {
          const numDots = 60; 
          dots = Array.from({ length: numDots }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2.1 + 1.5, 
            color: randomGray(),
          }));
        }

        function getLineColorBase() {
          return getComputedStyle(document.body).getPropertyValue('--line-color-base').trim();
        }

        function getCanvasBackgroundColor() {
          return getComputedStyle(document.body).getPropertyValue('--canvas-background').trim();
        }

        function drawDots() {
            const canvasBackgroundColor = getCanvasBackgroundColor();
            ctx.fillStyle = canvasBackgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height); 

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

            const lineColorBase = getLineColorBase();

            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const dx = dots[i].x - dots[j].x;
                    const dy = dots[i].y - dots[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 80) {

                        const opacity = 1 - distance / 80;

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

        function animate() {
            drawDots();
            requestAnimationFrame(animate);
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        createDots();
        animate();

        const fileInput = document.getElementById('fileInput');
        const uploadButton = document.getElementById('uploadButton');
        const fileNameDisplay = document.getElementById('fileName');

        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', function() {
            const file = fileInput.files[0];
            if (file) {
                fileNameDisplay.textContent = file.name;
            } else {
                fileNameDisplay.textContent = "No file selected";
            }
        });

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

        let filteredItems = []; 

        function renderItemsEditor(items) {
          editor.innerHTML = ""; 
          items.forEach((item, index) => {
              const block = document.createElement("div");
              block.className = "item-block";
              block.setAttribute("data-index", index);

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

              block.querySelector(".item-text").addEventListener("input", () => {
                  const itemIndex = jsonData.items.findIndex(i => i.id === item.id);
                  if (itemIndex !== -1) {
                      jsonData.items[itemIndex].text = block.querySelector(".item-text").value;
                  }
              });

              block.querySelector(".item-emoji").addEventListener("input", () => {
                  const itemIndex = jsonData.items.findIndex(i => i.id === item.id);
                  if (itemIndex !== -1) {
                      jsonData.items[itemIndex].emoji = block.querySelector(".item-emoji").value;
                  }
              });

              block.querySelector(".discovery-checkbox").addEventListener("change", (event) => {
                  const isChecked = event.target.checked;
                  const itemIndex = jsonData.items.findIndex(i => i.id === item.id);
                  if (itemIndex !== -1) {
                      if (isChecked) {

                          jsonData.items[itemIndex].discovery = true;
                      } else {

                          delete jsonData.items[itemIndex].discovery;
                      }
                  }
              });

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

          const newItemBlock = document.querySelector(`.item-block[data-index="${nextId}"]`);
          if (newItemBlock) {
              const newItemTextInput = newItemBlock.querySelector(".item-text");
              if (newItemTextInput) {
                  newItemTextInput.focus();

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

        searchBar.addEventListener("input", () => {
            const query = searchBar.value.toLowerCase().trim();

            if (query === "") {
                resetSearch();
            } else {

                filteredItems = jsonData.items.filter(item =>
                    item.text.toLowerCase().includes(query) ||
                    item.emoji.toLowerCase().includes(query)
                );
                renderItemsEditor(filteredItems); 
            }
        });

        function resetSearch() {
            searchBar.value = ""; 
            filteredItems = []; 
            renderItemsEditor(jsonData.items); 
        }

        function deleteRow(id) {

            jsonData.items = jsonData.items.filter(item => item.id !== id);

            if (filteredItems.length > 0) {
                filteredItems = filteredItems.filter(item => item.id !== id);
            }

            const itemsToRender = filteredItems.length > 0 ? filteredItems : jsonData.items;
            renderItemsEditor(itemsToRender);
        }

        const nameEditor = document.getElementById('nameEditor');
        const nameInput = document.getElementById('nameInput');

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
                            nameInput.value = jsonData.name; 
                            nameEditor.classList.remove('hidden'); 
                        }

                        if (jsonData.items && Array.isArray(jsonData.items)) {
                            renderItemsEditor(jsonData.items);

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

        nameInput.addEventListener('input', () => {
            jsonData.name = nameInput.value; 
        });

        const createSaveButton = document.getElementById('createSaveButton');

        createSaveButton.addEventListener('click', () => {

          const currentTimestamp = Date.now();

          jsonData = {
            name: "New Save",
            version: "1.0",
            created: currentTimestamp,       
            updated: 0,                      
            instances: [],                   
            items: [
              { id: 0, text: "Water", emoji: "💧" },
              { id: 1, text: "Fire", emoji: "🔥" },
              { id: 2, text: "Wind", emoji: "🌬️" },
              { id: 3, text: "Earth", emoji: "🌍" }
            ]
          };

          renderItemsEditor(jsonData.items);

          document.getElementById('nameEditor').classList.remove('hidden');
          document.getElementById('addRow').classList.remove('hidden');
          document.getElementById('exportJson').classList.remove('hidden');
          document.getElementById('searchBar').classList.remove('hidden');

          const nameInput = document.getElementById('nameInput');
          nameInput.value = jsonData.name;
        });
