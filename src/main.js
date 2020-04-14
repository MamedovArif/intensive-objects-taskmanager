import BoardComponent from "./view/board.js";
import BoardPresenter from "./presenter/board.js";
import FilterComponent from "./view/filter.js";
import SiteMenuComponent from "./view/site-menu.js";
import {generateTasks} from "./mock/task.js";
import {generateFilters} from "./mock/filter.js";
import {render, RenderPosition} from "./utils/render.js";


const TASK_COUNT = 22;

const siteMainElement = document.querySelector(`.main`);
const siteHeaderElement = siteMainElement.querySelector(`.main__control`);

const tasks = generateTasks(TASK_COUNT);
const filters = generateFilters();

render(siteHeaderElement, new SiteMenuComponent(), RenderPosition.BEFOREEND);
render(siteMainElement, new FilterComponent(filters), RenderPosition.BEFOREEND);

const boardComponent = new BoardComponent();
const boardPresenter = new BoardPresenter(boardComponent);

render(siteMainElement, boardComponent, RenderPosition.BEFOREEND);
boardPresenter.render(tasks);
