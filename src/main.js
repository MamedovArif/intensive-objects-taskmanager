import BoardComponent from "./view/board.js";
import BoardPresenter from "./presenter/board.js";
import FilterPresenter from "./presenter/filter.js";
import StatisticsComponent from "./view/statistics.js";
import SiteMenuComponent, {MenuItem} from "./view/site-menu.js";
import TasksModel from "./model/tasks.js";
import {generateTasks} from "./mock/task.js";
import {render, RenderPosition} from "./utils/render.js";

const TASK_COUNT = 22;

const siteMainElement = document.querySelector(`.main`);
const siteHeaderElement = siteMainElement.querySelector(`.main__control`);
const siteMenuComponent = new SiteMenuComponent();

render(siteHeaderElement, siteMenuComponent, RenderPosition.BEFOREEND);

const tasks = generateTasks(TASK_COUNT);
const tasksModel = new TasksModel();
tasksModel.setTasks(tasks);

const filterPresenter = new FilterPresenter(siteMainElement, tasksModel);
filterPresenter.render();

const boardComponent = new BoardComponent();
render(siteMainElement, boardComponent, RenderPosition.BEFOREEND);

const boardPresenter = new BoardPresenter(boardComponent, tasksModel);
boardPresenter.render();

const dateTo = new Date();
const dateFrom = (() => {
  const d = new Date(dateTo);
  d.setDate(d.getDate() - 7);
  return d;
})();
const statisticsComponent = new StatisticsComponent({tasks: tasksModel, dateFrom, dateTo});
render(siteMainElement, statisticsComponent, RenderPosition.BEFOREEND);
statisticsComponent.hide();

siteMenuComponent.setOnChange((menuItem) => {
  switch (menuItem) {
    case MenuItem.NEW_TASK:
      siteMenuComponent.setActiveItem(MenuItem.TASKS);
      statisticsComponent.hide();
      boardPresenter.show();
      boardPresenter.createTask();
      break;
    case MenuItem.STATISTICS:
      boardPresenter.hide();
      statisticsComponent.show();
      break;
    case MenuItem.TASKS:
      statisticsComponent.hide();
      boardPresenter.show();
      break;
  }
});
