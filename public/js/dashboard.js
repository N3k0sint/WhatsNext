/**
 * dashboard.js — Task Delete Confirmation Modal
 *
 * Replaces the inline onsubmit="return confirm(...)" handler (which was blocked
 * by Content-Security-Policy scriptSrc: 'self') with a Bootstrap Modal.
 *
 * SSDLC / CodeQL XSS-through-DOM fix:
 *   Task ID is parsed as a strict positive integer before use in form.action.
 *   Task title is displayed via textContent (never innerHTML) to prevent XSS.
 */
(function () {
  var body      = document.body;
  var csrfToken = body.getAttribute('data-csrf');

  var pendingTaskId = null;
  var deleteModal   = null;

  function getDeleteModal() {
    if (!deleteModal) {
      deleteModal = new bootstrap.Modal(document.getElementById('deleteTaskModal'));
    }
    return deleteModal;
  }

  // Delegated listener for all task Delete buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action="delete-task"]');
    if (!btn) return;

    var rawId    = btn.getAttribute('data-task-id');
    var parsedId = parseInt(rawId, 10);

    // Validate: must be a safe positive integer (CodeQL XSS-through-DOM fix)
    if (isNaN(parsedId) || parsedId <= 0 || String(parsedId) !== rawId.trim()) {
      console.error('Invalid task ID — delete aborted.');
      return;
    }

    pendingTaskId = parsedId;

    // Use textContent (not innerHTML) to safely display title — prevents XSS
    var title = btn.getAttribute('data-task-title') || 'this task';
    document.getElementById('deleteTaskName').textContent = title;

    getDeleteModal().show();
  });

  // Confirm Delete — submit form with validated integer ID
  document.getElementById('confirmDeleteTaskBtn').addEventListener('click', function () {
    if (!pendingTaskId) return;

    var form = document.getElementById('deleteTaskForm');
    var csrfInput = form.querySelector('input[name="_csrf"]');
    if (csrfInput) csrfInput.value = csrfToken;

    // Safe: pendingTaskId is a validated positive integer
    form.action = '/tasks/' + pendingTaskId + '/delete';
    form.submit();
  });
}());
