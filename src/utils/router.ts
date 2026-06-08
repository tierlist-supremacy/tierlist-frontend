// Simple router utility for SPA navigation
export const useNavigate = () => {
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return navigate;
};
