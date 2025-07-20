export function renderComments(commentList, container, handleReplySubmit) {
  console.log(" Rendering", commentList.length, "comments");
  container.innerHTML = '';
  commentList.forEach(comment => {
    const commentElement = createCommentElement(comment, handleReplySubmit);
    container.appendChild(commentElement);
  });
}

function createCommentElement(comment, handleReplySubmit) {
  const div = document.createElement('div');
  div.classList.add('mb-3', 'p-2', 'border', 'rounded');

  //  Indentation based on depth
  const indent = Math.min(comment.depth || 0, 3) * 20;
  div.style.marginLeft = `${indent}px`;

  const replyCount = comment.replies?.length || 0;

  div.innerHTML = `
    <strong>${comment.User?.name || 'Unknown'}:</strong> ${comment.content}
    <div class="mt-1">
      ${replyCount > 0 ? `<button class="btn btn-sm btn-link show-replies-btn" data-id="${comment.id}">Show ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}</button>` : ''}
      <button class="btn btn-sm btn-outline-secondary reply-btn" data-id="${comment.id}">Reply</button>
    </div>

    <div class="reply-form d-none mt-2">
      <input class="form-control reply-input" placeholder="Write a reply...">
      <button class="btn btn-sm btn-primary mt-1 submit-reply-btn" data-id="${comment.id}">Send</button>
    </div>

    <div class="replies mt-2 d-none"></div>
  `;

  const showRepliesBtn = div.querySelector('.show-replies-btn');
  const repliesContainer = div.querySelector('.replies');

  if (showRepliesBtn) {
    showRepliesBtn.addEventListener('click', () => {
      repliesContainer.classList.toggle('d-none');
      showRepliesBtn.textContent = repliesContainer.classList.contains('d-none')
        ? `Show ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}`
        : `Hide Replies`;

      if (!repliesContainer.dataset.loaded) {
        comment.replies.forEach(reply => {
          const replyElement = createCommentElement(reply, handleReplySubmit);
          repliesContainer.appendChild(replyElement);
        });
        repliesContainer.dataset.loaded = true;
      }
    });
  }

  //  Toggle reply form
  const replyBtn = div.querySelector('.reply-btn');
  const replyForm = div.querySelector('.reply-form');
  replyBtn.addEventListener('click', () => {
    replyForm.classList.toggle('d-none');
  });

  //  Handle reply submission
  const sendBtn = div.querySelector('.submit-reply-btn');
  const input = div.querySelector('.reply-input');
  sendBtn.addEventListener('click', () => {
    handleReplySubmit(comment.id, input);
  });

  return div;
}
