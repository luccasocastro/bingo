import {
  clearNumbers,
  createInitialState,
  deserializeState,
  serializeState,
  setTitle,
  toggleNumber,
} from './bingoState.js';

const STORAGE_KEY = 'bingo-web-state';
const CHANNEL_NAME = 'bingo-web-sync';

const app = document.querySelector('#app');
const isPresentation = new URLSearchParams(window.location.search).has('present');
const syncChannel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;

let state = loadState();

render();

syncChannel?.addEventListener('message', (event) => {
  state = deserializeState(event.data);
  render();
});

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) {
    return;
  }

  state = deserializeState(event.newValue);
  render();
});

function loadState() {
  return deserializeState(localStorage.getItem(STORAGE_KEY));
}

function saveState(nextState) {
  state = nextState;
  const serializedState = serializeState(state);
  localStorage.setItem(STORAGE_KEY, serializedState);
  syncChannel?.postMessage(serializedState);
  render();
}

function render() {
  app.replaceChildren();
  document.body.classList.toggle('presentation-mode', isPresentation);
  document.title = isPresentation ? `${state.title} - Apresentacao` : state.title;

  const page = document.createElement('main');
  page.className = isPresentation ? 'presentation-page' : 'control-page';

  const header = document.createElement('header');
  header.className = 'app-header';

  const title = document.createElement('h1');
  title.textContent = state.title;
  header.append(title);

  if (!isPresentation) {
    header.append(createControls());
  }

  page.append(header, createGrid(), createRecentMarked());
  app.append(page);
}

function createControls() {
  const controls = document.createElement('section');
  controls.className = 'controls';
  controls.setAttribute('aria-label', 'Controles do bingo');

  const titleGroup = document.createElement('label');
  titleGroup.className = 'title-control';
  titleGroup.textContent = 'Titulo';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = state.title;
  titleInput.maxLength = 60;
  titleInput.addEventListener('change', () => {
    saveState(setTitle(state, titleInput.value));
  });

  titleGroup.append(titleInput);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const presentButton = document.createElement('button');
  presentButton.type = 'button';
  presentButton.className = 'primary-button';
  presentButton.textContent = 'Apresentar';
  presentButton.addEventListener('click', openPresentation);

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'secondary-button';
  clearButton.textContent = 'Limpar';
  clearButton.addEventListener('click', () => {
    saveState(clearNumbers(state));
  });

  actions.append(presentButton, clearButton);
  controls.append(titleGroup, actions);

  return controls;
}

function createGrid() {
  const grid = document.createElement('section');
  grid.className = 'bingo-grid';
  grid.setAttribute('aria-label', 'Cartela de bingo de 1 a 75');

  state.numbers.forEach((number) => {
    const cell = document.createElement(isPresentation ? 'div' : 'button');
    cell.className = number.marked ? 'bingo-cell marked' : 'bingo-cell';
    cell.textContent = String(number.value);
    cell.setAttribute('aria-label', `Numero ${number.value}`);

    if (!isPresentation) {
      cell.type = 'button';
      cell.setAttribute('aria-pressed', String(number.marked));
      cell.addEventListener('click', () => {
        saveState(toggleNumber(state, number.value));
      });
    }

    grid.append(cell);
  });

  return grid;
}

function createRecentMarked() {
  const section = document.createElement('section');
  section.className = 'recent-marked';
  section.setAttribute('aria-label', 'Ultimas 5 casas marcadas');

  const heading = document.createElement('h2');
  heading.textContent = 'Ultimas 5 marcadas';

  const list = document.createElement('ol');
  list.className = 'recent-list';

  if (state.recentMarked.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'recent-empty';
    empty.textContent = 'Nenhuma casa marcada ainda';
    section.append(heading, empty);
    return section;
  }

  state.recentMarked.forEach((value) => {
    const item = document.createElement('li');
    item.textContent = String(value);
    list.append(item);
  });

  section.append(heading, list);
  return section;
}

function openPresentation() {
  saveState(state);

  const presentationUrl = new URL(window.location.href);
  presentationUrl.searchParams.set('present', '1');
  window.open(presentationUrl.toString(), 'bingo-presentation');
}

if (!localStorage.getItem(STORAGE_KEY)) {
  saveState(createInitialState());
}
