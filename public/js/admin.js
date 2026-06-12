/**
 * admin.js — Admin Panel Modal Confirmations
 * Reads CSRF token and current user ID from body data attributes
 * to avoid inline scripts blocked by Content-Security-Policy.
 */
(function () {
  var body          = document.body;
  var csrfToken     = body.getAttribute('data-csrf');
  var currentUserId = body.getAttribute('data-user-id');

  var pendingDeleteId = null;
  var pendingEditId   = null;

  // Lazily initialise Bootstrap modals after DOM is ready
  var deleteModal = null;
  var editModal   = null;

  function getDeleteModal() {
    if (!deleteModal) {
      deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    }
    return deleteModal;
  }

  function getEditModal() {
    if (!editModal) {
      editModal = new bootstrap.Modal(document.getElementById('editConfirmModal'));
    }
    return editModal;
  }

  // Delegated click listener — catches all action buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;

    var action   = btn.getAttribute('data-action');
    var userId   = btn.getAttribute('data-user-id');
    var username = btn.getAttribute('data-username');

    if (action === 'delete') {
      pendingDeleteId = userId;
      document.getElementById('deleteUserName').textContent = username;
      getDeleteModal().show();
    }

    if (action === 'edit') {
      pendingEditId = userId;
      document.getElementById('editUserName').textContent = username;
      getEditModal().show();
    }
  });

  // Confirm Delete — set form action using stored ID and submit
  document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (!pendingDeleteId) return;
    var form = document.getElementById('deleteUserForm');
    // Update the hidden CSRF input in case it wasn't set
    var csrfInput = form.querySelector('input[name="_csrf"]');
    if (csrfInput) csrfInput.value = csrfToken;
    form.action = '/admin/users/' + pendingDeleteId + '/delete';
    form.submit();
  });

  // Confirm Edit — navigate to the edit page
  document.getElementById('confirmEditBtn').addEventListener('click', function () {
    if (!pendingEditId) return;
    window.location.href = '/admin/users/' + pendingEditId + '/edit';
  });
}());
