import LoadMoreButtonComponent from "../view/load-more-button.js";
import NoTasksComponent from "../view/no-tasks.js";
import SortComponent, {SortType} from "../view/sort.js";
import TaskPresenter, {Mode as TaskPresenterMode, EmptyTask} from "./task.js";
import TasksComponent from "../view/tasks.js";
import {render, remove, RenderPosition} from "../utils/render.js";

const SHOWING_TASKS_COUNT_ON_START = 8;
const SHOWING_TASKS_COUNT_BY_BUTTON = 8;

const renderTasks = (taskListElement, tasks, onDataChange, onViewChange) => {
  return tasks.map((task) => {
    const taskPresenter = new TaskPresenter(taskListElement, onDataChange, onViewChange);
    taskPresenter.render(task, TaskPresenterMode.DEFAULT);

    return taskPresenter;
  });
};

const getSortedTasks = (tasks, sortType, from, to) => {
  let sortedTasks = [];
  const showingTasks = tasks.slice();

  switch (sortType) {
    case SortType.DATE_UP:
      sortedTasks = showingTasks.sort((a, b) => a.dueDate - b.dueDate);
      break;
    case SortType.DATE_DOWN:
      sortedTasks = showingTasks.sort((a, b) => b.dueDate - a.dueDate);
      break;
    case SortType.DEFAULT:
      sortedTasks = showingTasks;
      break;
  }

  return sortedTasks.slice(from, to);
};


export default class BoardPresenter {
  constructor(container, tasksModel, api) {
    this._container = container;
    this._tasksModel = tasksModel;
    this._api = api;

    this._showedTaskPresenters = [];
    this._showingTasksCount = SHOWING_TASKS_COUNT_ON_START;
    this._noTasksComponent = new NoTasksComponent();
    this._sortComponent = new SortComponent();
    this._tasksComponent = new TasksComponent();
    this._loadMoreButtonComponent = new LoadMoreButtonComponent();
    this._creatingTask = null;

    this._onDataChange = this._onDataChange.bind(this);
    this._onSortTypeChange = this._onSortTypeChange.bind(this);
    this._onViewChange = this._onViewChange.bind(this);
    this._onLoadMoreButtonClick = this._onLoadMoreButtonClick.bind(this);
    this._onFilterChange = this._onFilterChange.bind(this);

    this._sortComponent.setSortTypeChangeHandler(this._onSortTypeChange);
    this._tasksModel.setFilterChangeHandler(this._onFilterChange);
  }

  hide() {
    this._container.hide();
  }

  show() {
    this._container.show();
  }

  render() {
    const container = this._container.getElement();
    const tasks = this._tasksModel.getTasks();
    const isAllTasksArchived = tasks.every((task) => task.isArchive);

    if (isAllTasksArchived) {
      render(container, this._noTasksComponent, RenderPosition.BEFOREEND);
      return;
    }

    render(container, this._sortComponent, RenderPosition.BEFOREEND);
    render(container, this._tasksComponent, RenderPosition.BEFOREEND);

    this._renderTasks(tasks.slice(0, this._showingTasksCount));

    this._renderLoadMoreButton();
  }

  createTask() {
    if (this._creatingTask) {
      return;
    }

    const taskListElement = this._tasksComponent.getElement();
    this._creatingTask = new TaskPresenter(taskListElement, this._onDataChange, this._onViewChange);
    this._creatingTask.render(EmptyTask, TaskPresenterMode.ADDING);
  }

  _removeTasks() {
    this._showedTaskPresenters.forEach((taskPresenter) => taskPresenter.destroy());
    this._showedTaskPresenters = [];
  }

  _renderTasks(tasks) {
    const taskListElement = this._tasksComponent.getElement();

    const newTasks = renderTasks(taskListElement, tasks, this._onDataChange, this._onViewChange);
    this._showedTaskPresenters = this._showedTaskPresenters.concat(newTasks);
    this._showingTasksCount = this._showedTaskPresenters.length;
  }

  _renderLoadMoreButton() {
    remove(this._loadMoreButtonComponent);

    if (this._showingTasksCount >= this._tasksModel.getTasks().length) {
      return;
    }

    const container = this._container.getElement();
    render(container, this._loadMoreButtonComponent, RenderPosition.BEFOREEND);
    this._loadMoreButtonComponent.setClickHandler(this._onLoadMoreButtonClick);
  }

  _updateTasks(count) {
    this._removeTasks();
    this._renderTasks(this._tasksModel.getTasks().slice(0, count));
    this._renderLoadMoreButton();
  }

  _onDataChange(taskPresenter, oldData, newData) {
    if (oldData === EmptyTask) {
      this._creatingTask = null;
      if (newData === null) {
        taskPresenter.destroy();
        this._updateTasks(this._showingTasksCount);
      } else {
        this._api.createTask(newData)
          .then((taskModel) => {
            this._tasksModel.addTask(taskModel);
            taskPresenter.render(taskModel, TaskPresenterMode.DEFAULT);

            if (this._showingTasksCount % SHOWING_TASKS_COUNT_BY_BUTTON === 0) {
              const destroyedTask = this._showedTaskPresenters.pop();
              destroyedTask.destroy();
            }

            this._showedTaskPresenters = [].concat(taskPresenter, this._showedTaskPresenters);
            this._showingTasksCount = this._showedTaskPresenters.length;

            this._renderLoadMoreButton();
          })
          .catch(() => {
            taskPresenter.shake();
          });
      }
    } else if (newData === null) {
      this._api.deleteTask(oldData.id)
        .then(() => {
          this._tasksModel.removeTask(oldData.id);
          this._updateTasks(this._showingTasksCount);
        })
        .catch(() => {
          taskPresenter.shake();
        });
    } else {
      this._api.updateTask(oldData.id, newData)
        .then((taskModel) => {
          const isSuccess = this._tasksModel.updateTask(oldData.id, taskModel);

          if (isSuccess) {
            taskPresenter.render(taskModel, TaskPresenterMode.DEFAULT);
            this._updateTasks(this._showingTasksCount);
          }
        })
        .catch(() => {
          taskPresenter.shake();
        });
    }
  }

  _onViewChange() {
    this._showedTaskPresenters.forEach((it) => it.setDefaultView());
  }

  _onSortTypeChange(sortType) {
    this._showingTasksCount = SHOWING_TASKS_COUNT_ON_START;

    const sortedTasks = getSortedTasks(this._tasksModel.getTasks(), sortType, 0, this._showingTasksCount);

    this._removeTasks();
    this._renderTasks(sortedTasks);

    this._renderLoadMoreButton();
  }

  _onLoadMoreButtonClick() {
    const prevTasksCount = this._showingTasksCount;
    const tasks = this._tasksModel.getTasks();

    this._showingTasksCount = this._showingTasksCount + SHOWING_TASKS_COUNT_BY_BUTTON;

    const sortedTasks = getSortedTasks(tasks, this._sortComponent.getSortType(), prevTasksCount, this._showingTasksCount);
    this._renderTasks(sortedTasks);

    if (this._showingTasksCount >= sortedTasks.length) {
      remove(this._loadMoreButtonComponent);
    }
  }

  _onFilterChange() {
    this._updateTasks(SHOWING_TASKS_COUNT_ON_START);
  }
}
