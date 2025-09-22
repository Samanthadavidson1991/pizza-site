// Redirect to admin-dashboard.html if not logged in
(function() {
  if (!localStorage.getItem('adminUser')) {
    window.location.href = 'admin-dashboard.html';
  }
})();
