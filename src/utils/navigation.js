export const safeBack = (navigate, location, fallback = '/app/home') => {
  if (location.state?.from) {
    navigate(location.state.from);
  } else if (window.history.state && window.history.state.idx > 0) {
    navigate(-1);
  } else {
    navigate(fallback);
  }
};
