let chapters = [];
let historyStack = [];
let inventory = [];

const titleEl = document.getElementById("chapter-title");
const descriptionEl = document.getElementById("chapter-description");
const imageEl = document.getElementById("chapter-image");
const optionsContainer = document.getElementById("options-container");
const inventoryList = document.getElementById("inventory-list");

async function loadChapters() {
  try {
    const response = await fetch("/aethrakor-1/chapters.json");
    chapters = await response.json();
    showChapter(1);
  } catch (err) {
    console.error("Error loading chapter data:", err);
    titleEl.textContent = "Error";
    descriptionEl.textContent = "Could not load the story data.";
  }
}

function showChapter(id) {
  const chapter = chapters.find(ch => ch.chapterId === id);
  if (!chapter) return;

  titleEl.textContent = chapter.title;

  // Start with base chapter description
  let description = chapter.baseDescription || chapter.description;

  // Hide inventory if this is a dead end (true ending)
  if (chapter.isEnding && chapter.options.length === 0) {
    document.getElementById("inventory-panel").style.display = "none";
  } else {
    document.getElementById("inventory-panel").style.display = "block";
  }

  // Add item discovery descriptions only if player doesn't have them
  if (chapter.items) {
    for (const [itemKey, itemData] of Object.entries(chapter.items)) {
      if (!inventory.includes(itemKey)) {
        description += `<p><em>${itemData.description}</em></p>`;
      }
    }
  }

  descriptionEl.innerHTML = description;
  imageEl.src = `/aethrakor-1/images/${chapter.image}`;
  imageEl.alt = chapter.title;

  optionsContainer.innerHTML = "";

  // Show pick-up buttons
  if (chapter.items) {
    for (const [itemKey, itemData] of Object.entries(chapter.items)) {
      if (!inventory.includes(itemKey)) {
        const itemBtn = document.createElement("button");
        itemBtn.textContent = `Pick up: ${itemData.name}`;
        itemBtn.onclick = () => {
          inventory.push(itemKey);
          updateInventory();
          showChapter(id); // refresh UI
        };
        optionsContainer.appendChild(itemBtn);
      }
    }
  }

  // Show navigation options
  chapter.options.forEach(option => {
    let show = true;

    if (option.requiredItems) {
      show = option.requiredItems.every(req => inventory.includes(req));
    }

    if (show) {
      const btn = document.createElement("button");
      btn.textContent = option.text;
      btn.onclick = () => {
        if (option.useItems) {
          option.useItems.forEach(item => {
            const i = inventory.indexOf(item);
            if (i !== -1) inventory.splice(i, 1);
          });
          updateInventory();
        }
        historyStack.push(chapter.chapterId);
        showChapter(option.destinationId);
      };
      optionsContainer.appendChild(btn);
    }
  });

  // Only show "Go Back" if it's not a true end
  if (
    chapter.options.length === 0 &&
    historyStack.length > 0 &&
    !chapter.isEnding
  ) {
    const backBtn = document.createElement("button");
    backBtn.textContent = "Go Back";
    backBtn.onclick = () => {
      const prevId = historyStack.pop();
      if (prevId !== undefined) showChapter(prevId);
    };
    optionsContainer.appendChild(backBtn);
  }
}

function updateInventory() {
  inventoryList.innerHTML = "";
  inventory.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;

    const useBtn = document.createElement("button");
    useBtn.textContent = "Use";
    useBtn.onclick = () => {
      alert(`You used the ${item}.`);
      inventory.splice(inventory.indexOf(item), 1);
      updateInventory();
    };

    const discardBtn = document.createElement("button");
    discardBtn.textContent = "Discard";
    discardBtn.onclick = () => {
      inventory.splice(inventory.indexOf(item), 1);
      alert(`You discarded the ${item}. It may be picked up again later.`);
      updateInventory();
    };

    li.appendChild(useBtn);
    li.appendChild(discardBtn);
    inventoryList.appendChild(li);
  });
}

loadChapters();
