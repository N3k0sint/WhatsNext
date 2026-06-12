/**
 * admin.js — Admin Panel: Delete Confirmation Modal
 * Reads CSRF token from body data attribute (set in header.ejs).
 * No inline scripts — fully compliant with Content-Security-Policy.
 *
 * SSDLC Note: Edit navigates directly to /admin/users/:id/edit (a GET route
 * protected server-side by isAuthenticated + isAdmin middleware + audit logging).
 * Only Delete requires a client-side confirmation modal due to its destructive nature.
 */
(function () {
  var body      = document.body;
  var csrfToken = body.getAttribute('data-csrf');

  var pendingDeleteId = null;
  var deleteModal     = null;

  function getDeleteModal() {
    if (!deleteModal) {
      deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    }
    return deleteModal;
  }

  // Delegated click listener — catches all Delete buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;

    pendingDeleteId = btn.getAttribute('data-user-id');
    var username    = btn.getAttribute('data-username');
    document.getElementById('deleteUserName').textContent = username;
    getDeleteModal().show();
  });

  // Confirm Delete — set form action and submit
  document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (!pendingDeleteId) return;
    var form = document.getElementById('deleteUserForm');
    var csrfInput = form.querySelector('input[name="_csrf"]');
    if (csrfInput) csrfInput.value = csrfToken;
    form.action = '/admin/users/' + pendingDeleteId + '/delete';
    form.submit();
  });
}());
