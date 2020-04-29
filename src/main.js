import Api from "./api.js";
import BoardComponent from "./view/board.js";
import BoardPresenter from "./presenter/board.js";
import FilterPresenter from "./presenter/filter.js";
import SiteMenuComponent, {MenuItem} from "./view/site-menu.js";
import StatisticsComponent from "./view/statistics.js";
import TasksModel from "./model/tasks.js";
import {render, RenderPosition} from "./utils/render.js";

const AUTHORIZATION = `Basic hSncv2sddfSwclsaj`;
const END_POINT = `https://11.ecmascript.pages.academy/task-manager`;

const dateTo = new Date();
const dateFrom = (() => {
  const d = new Date(dateTo);
  d.setDate(d.getDate() - 7);
  return d;
})();

const api = new Api(END_POINT, AUTHORIZATION);
const tasksModel = new TasksModel();

const siteMainElement = document.querySelector(`.main`);
const siteHeaderElement = siteMainElement.querySelector(`.main__control`);
const siteMenuComponent = new SiteMenuComponent();
const statisticsComponent = new StatisticsComponent({tasks: tasksModel, dateFrom, dateTo});

const boardComponent = new BoardComponent();
const boardPresenter = new BoardPresenter(boardComponent, tasksModel, api);
const filterPresenter = new FilterPresenter(siteMainElement, tasksModel);

render(siteHeaderElement, siteMenuComponent, RenderPosition.BEFOREEND);
filterPresenter.render();
render(siteMainElement, boardComponent, RenderPosition.BEFOREEND);
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

api.getTasks()
  .then((tasks) => {
    tasksModel.setTasks(tasks);
    boardPresenter.render();
  });
