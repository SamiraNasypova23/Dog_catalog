'use strict';

const STORAGE_KEY = 'dog-catalog-items';
const categoryNames = {
  service: 'Служебные',
  hunting: 'Охотничьи',
  herding: 'Пастушьи',
  decorative: 'Декоративные'
};

const cards = document.querySelector('#cards');
const queryInput = document.querySelector('#query');
const categorySelect = document.querySelector('#category');
const sortSelect = document.querySelector('#sort');
const dialog = document.querySelector('#breed-dialog');
const form = document.querySelector('#breed-form');
const fields = [...form.querySelectorAll('input, select, textarea')];
let submitted = false;

// Демонстрационные записи соответствуют карточкам ЛР №1.
const defaultItems = [
  { id: 'dog-1', name: 'Немецкая овчарка', category: 'service', description: 'Умный и преданный защитник', image: 'gsd.png', createdAt: 1 },
  { id: 'dog-2', name: 'Доберман', category: 'service', description: 'Элегантный и бдительный страж', image: 'doberman.png', createdAt: 2 },
  { id: 'dog-3', name: 'Лабрадор-ретривер', category: 'hunting', description: 'Добродушный семейный любимец', image: 'labrador.png', createdAt: 3 },
  { id: 'dog-4', name: 'Бигль', category: 'hunting', description: 'Весёлый следопыт с добрым нравом', image: 'beagle.png', createdAt: 4 },
  { id: 'dog-5', name: 'Бордер-колли', category: 'herding', description: 'Самая умная овчарка мира', image: 'border_collie.png', createdAt: 5 },
  { id: 'dog-6', name: 'Австралийская овчарка', category: 'herding', description: 'Энергичный и яркий компаньон', image: 'aussie.png', createdAt: 6 },
  { id: 'dog-7', name: 'Померанский шпиц', category: 'decorative', description: 'Пушистый миниатюрный компаньон', image: 'spitz.png', createdAt: 7 },
  { id: 'dog-8', name: 'Чихуахуа', category: 'decorative', description: 'Смелый малыш с большим сердцем', image: 'chihuahua.png', createdAt: 8 }
];

const state = {
  items: loadItems(),
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'name-asc',
  storageMessage: ''
};

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return defaultItems.map(item => ({ ...item }));
    const items = JSON.parse(saved);
    if (!Array.isArray(items)) throw new Error('Bad data');
    return items;
  } catch {
    return defaultItems.map(item => ({ ...item }));
  }
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    state.storageMessage = '';
  } catch {
    state.storageMessage = 'Не удалось сохранить список в браузере.';
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createCard(item) {
  const card = makeElement('article', 'card');
  if (item.image) {
    const image = makeElement('img');
    image.src = `https://raw.githubusercontent.com/SamiraNasypova23/Dog_catalog/main/img/${item.image}`;
    image.alt = item.name;
    image.loading = 'lazy';
    card.append(image);
  } else {
    card.append(makeElement('div', 'image-placeholder', '🐕'));
  }

  const content = makeElement('div', 'card-content');
  content.append(
    makeElement('span', 'tag', categoryNames[item.category]),
    makeElement('h3', '', item.name),
    makeElement('p', '', item.description)
  );
  const removeButton = makeElement('button', 'delete-button', 'Удалить');
  removeButton.type = 'button';
  removeButton.dataset.deleteId = item.id;
  removeButton.setAttribute('aria-label', `Удалить: ${item.name}`);
  content.append(removeButton);
  card.append(content);
  return card;
}

function getVisibleItems() {
  const text = state.searchQuery.trim().toLocaleLowerCase('ru');
  const filtered = state.items.filter(item => {
    const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory;
    const matchesText = `${item.name} ${item.description} ${categoryNames[item.category]}`
      .toLocaleLowerCase('ru').includes(text);
    return matchesCategory && matchesText;
  });

  return [...filtered].sort((a, b) => {
    if (state.sortBy === 'newest') return b.createdAt - a.createdAt;
    if (state.sortBy === 'oldest') return a.createdAt - b.createdAt;
    const result = a.name.localeCompare(b.name, 'ru');
    return state.sortBy === 'name-desc' ? -result : result;
  });
}

function render() {
  const items = getVisibleItems();
  const fragment = document.createDocumentFragment();
  items.forEach(item => fragment.append(createCard(item)));
  cards.replaceChildren(fragment);

  queryInput.value = state.searchQuery;
  categorySelect.value = state.selectedCategory;
  sortSelect.value = state.sortBy;
  document.querySelector('#result-count').textContent = `Показано ${items.length} из ${state.items.length}`;

  const empty = document.querySelector('#empty-state');
  empty.hidden = items.length > 0;
  document.querySelector('#empty-message').textContent = state.items.length === 0
    ? 'В каталоге пока нет пород. Добавьте первую запись.'
    : 'По вашему запросу ничего не найдено.';
  const emptyAction = document.querySelector('#empty-action');
  emptyAction.textContent = state.items.length === 0 ? 'Добавить породу' : 'Сбросить поиск';
  document.querySelector('#storage-message').textContent = state.storageMessage;
  document.querySelector('#storage-message').hidden = !state.storageMessage;
}

function resetFilters() {
  state.searchQuery = '';
  state.selectedCategory = 'all';
  state.sortBy = 'name-asc';
  render();
}

function showDialog() {
  form.reset();
  submitted = false;
  fields.forEach(field => {
    field.removeAttribute('aria-invalid');
    document.querySelector(`#${field.name}-error`).textContent = '';
  });
  dialog.showModal();
  fields[0].focus();
}

function fieldMessage(field) {
  if (field.validity.valueMissing) return 'Заполните это поле.';
  if (field.validity.tooShort) return `Введите не менее ${field.minLength} символов.`;
  if (field.validity.tooLong) return `Введите не более ${field.maxLength} символов.`;
  return '';
}

function validateField(field) {
  const message = fieldMessage(field);
  field.setAttribute('aria-invalid', String(!field.validity.valid));
  document.querySelector(`#${field.name}-error`).textContent = message;
  return field.validity.valid;
}

queryInput.addEventListener('input', event => {
  state.searchQuery = event.target.value;
  render();
});

categorySelect.addEventListener('change', event => {
  state.selectedCategory = event.target.value;
  render();
});

sortSelect.addEventListener('change', event => {
  state.sortBy = event.target.value;
  render();
});

document.querySelector('#reset').addEventListener('click', resetFilters);
document.querySelector('#open-dialog').addEventListener('click', showDialog);
document.querySelector('#empty-action').addEventListener('click', () => {
  if (state.items.length === 0) showDialog();
  else resetFilters();
});

document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

fields.forEach(field => field.addEventListener('input', () => {
  if (submitted) validateField(field);
}));

form.addEventListener('submit', event => {
  event.preventDefault();
  submitted = true;
  const isValid = fields.map(validateField).every(Boolean);
  if (!isValid) {
    fields.find(field => !field.validity.valid).focus();
    return;
  }

  state.items.push({
    id: `dog-${Date.now()}`,
    name: form.elements.name.value.trim(),
    category: form.elements.category.value,
    description: form.elements.description.value.trim(),
    createdAt: Date.now()
  });
  saveItems();
  state.selectedCategory = 'all';
  state.searchQuery = '';
  state.sortBy = 'newest';
  render();
  dialog.close();
});

// Один обработчик на сетке ловит нажатия по всем кнопкам удаления.
cards.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-id]');
  if (!button) return;
  state.items = state.items.filter(item => item.id !== button.dataset.deleteId);
  saveItems();
  render();
});

render();
