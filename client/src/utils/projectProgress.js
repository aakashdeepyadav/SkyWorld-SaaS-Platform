const PROJECT_PROGRESS_BY_STATUS = {
  planning: 25,
  'in-progress': 50,
  review: 75,
  completed: 100,
  cancelled: 0,
};

export const getProgressFromStatus = (status) => {
  if (!status) return 0;
  return PROJECT_PROGRESS_BY_STATUS[status] ?? 0;
};

export const getProjectProgress = (project) => getProgressFromStatus(project?.status);
