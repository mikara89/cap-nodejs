(function () {
  const API_BASE = '/api/cap';
  const limit = 20;
  let activeTab = 'outbox';
  let page = 1;
  let selectedId = '';
  let lastPage = 1;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    if (value == null) return '';
    return String(value).replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
      }[char];
    });
  }

  function toDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function statusFor(item) {
    if (activeTab === 'outbox') {
      if (item.status === 'published')
        return { label: 'Published', tone: 'success' };
      if (item.status === 'failed') return { label: 'Failed', tone: 'failed' };
      return { label: item.status || 'Pending', tone: 'pending' };
    }
    if (item.status === 'processed' || item.processed) {
      return { label: 'Processed', tone: 'success' };
    }
    if (item.status === 'failed' || item.status === 'dead_letter') {
      return { label: item.status, tone: 'failed' };
    }
    return { label: item.status || 'Pending', tone: 'pending' };
  }

  function itemTime(item) {
    return (
      item.occurredAt ||
      item.createdAt ||
      item.updatedAt ||
      item.nextRetry ||
      ''
    );
  }

  function getPreview(item) {
    if (item.payloadPreview) return item.payloadPreview;
    if (item.payload) return JSON.stringify(item.payload);
    return '';
  }

  function setLoading() {
    $('list').innerHTML = '<div class="empty">Loading</div>';
  }

  function clearDetail() {
    selectedId = '';
    $('detail-status').innerHTML = '';
    $('detail').innerHTML = '<div class="empty">Select a message</div>';
    $('detail-actions').innerHTML = '';
  }

  async function fetchList() {
    const topic = $('filter-topic').value.trim();
    const mode = $('filter-mode').value || 'all';
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (topic) qs.set('topic', topic);
    if (mode === 'due') {
      if (activeTab === 'inbox') qs.set('due', 'true');
      if (activeTab === 'outbox') qs.set('onlyUnpublished', 'true');
    }

    setLoading();
    try {
      const res = await fetch(`${API_BASE}/${activeTab}?${qs.toString()}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const items = data.items || data || [];
      const total = data.total || items.length;
      const currentPage = data.page || page;
      const currentLimit = data.limit || limit;
      lastPage = Math.max(1, Math.ceil(total / currentLimit));

      renderList(items);
      renderPagination(currentPage, total, currentLimit);
      renderSummary(items, total);
      updateTabCount(activeTab, total);
      $('last-updated').textContent = 'Updated ' + toDateTime(new Date());
      $('list-title').textContent = activeTab === 'outbox' ? 'Outbox' : 'Inbox';
      if (!selectedId) clearDetail();
    } catch (err) {
      $('list').innerHTML =
        `<div class="empty">Error: ${escapeHtml(err.message)}</div>`;
      renderSummary([], 0);
    }
  }

  function renderSummary(items, total) {
    const success = items.filter(function (item) {
      return activeTab === 'outbox'
        ? item.status === 'published'
        : Boolean(item.processed);
    }).length;
    const pending = Math.max(0, items.length - success);
    const retries = items.reduce(function (sum, item) {
      return sum + (item.retryCount || 0);
    }, 0);

    $('summary-total').textContent = String(total);
    $('summary-success').textContent = String(success);
    $('summary-pending').textContent = String(pending);
    $('summary-retries').textContent = String(retries);
  }

  function updateTabCount(tab, total) {
    const el = tab === 'outbox' ? $('tab-outbox-count') : $('tab-inbox-count');
    el.textContent = String(total);
  }

  function renderList(items) {
    if (!items.length) {
      $('list').innerHTML = '<div class="empty">No messages</div>';
      return;
    }

    $('list').innerHTML = items
      .map(function (item) {
        const status = statusFor(item);
        const selectedClass = item.id === selectedId ? ' selected' : '';
        return `
          <button class="item${selectedClass}" type="button" data-id="${escapeHtml(item.id)}">
            <span class="item-title">
              <span class="item-topic">${escapeHtml(item.topic)}</span>
            </span>
            <span class="badge ${status.tone}">${escapeHtml(status.label)}</span>
            <span class="meta-row">
              <span>${escapeHtml(toDateTime(itemTime(item)))}</span>
              <span>${item.retryCount || 0} retries</span>
              ${item.nextRetry ? `<span>Next ${escapeHtml(toDateTime(item.nextRetry))}</span>` : ''}
            </span>
            <span class="item-preview">${escapeHtml(getPreview(item))}</span>
          </button>`;
      })
      .join('');

    Array.from(document.querySelectorAll('#list .item')).forEach(function (el) {
      el.addEventListener('click', function () {
        loadDetail(el.getAttribute('data-id') || '');
      });
    });
  }

  function renderPagination(current, total, currentLimit) {
    const pages = Math.max(1, Math.ceil((total || 0) / currentLimit));
    const start = total === 0 ? 0 : (current - 1) * currentLimit + 1;
    const end = Math.min(total, current * currentLimit);
    $('list-range').textContent = total
      ? `${start}-${end} of ${total}`
      : '0 messages';
    $('pagination').innerHTML = `
      <span>Page ${current} of ${pages}</span>
      <span class="pagination-controls">
        <button class="button" id="prev-page" type="button" ${current <= 1 ? 'disabled' : ''}>Previous</button>
        <button class="button" id="next-page" type="button" ${current >= pages ? 'disabled' : ''}>Next</button>
      </span>`;

    $('prev-page').addEventListener('click', function () {
      if (page > 1) {
        page -= 1;
        fetchList();
      }
    });
    $('next-page').addEventListener('click', function () {
      if (page < lastPage) {
        page += 1;
        fetchList();
      }
    });
  }

  async function loadDetail(id) {
    selectedId = id;
    Array.from(document.querySelectorAll('#list .item')).forEach(function (el) {
      el.classList.toggle('selected', el.getAttribute('data-id') === id);
    });
    $('detail-status').innerHTML = '';
    $('detail').innerHTML = '<div class="empty">Loading</div>';
    $('detail-actions').innerHTML = '';

    try {
      const res = await fetch(`${API_BASE}/${activeTab}/${id}?full=true`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      renderDetail(await res.json());
    } catch (err) {
      $('detail').innerHTML =
        `<div class="empty">Error: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderDetail(item) {
    if (!item) {
      clearDetail();
      return;
    }

    const status = statusFor(item);
    const payload = item.payload || item;
    $('detail-status').innerHTML =
      `<span class="badge ${status.tone}">${escapeHtml(status.label)}</span>`;
    $('detail').innerHTML = `
      <div class="detail-grid">
        <div class="detail-field">
          <span>Topic</span>
          <strong>${escapeHtml(item.topic)}</strong>
        </div>
        <div class="detail-field">
          <span>Retries</span>
          <strong>${item.retryCount || 0}</strong>
        </div>
        <div class="detail-field">
          <span>Occurred</span>
          <strong>${escapeHtml(toDateTime(item.occurredAt))}</strong>
        </div>
        <div class="detail-field">
          <span>Next Retry</span>
          <strong>${escapeHtml(toDateTime(item.nextRetry) || '-')}</strong>
        </div>
      </div>
      <pre class="payload-block">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;

    const markLabel =
      activeTab === 'outbox' ? 'Mark Published' : 'Mark Processed';
    $('detail-actions').innerHTML = `
      <button class="button primary" id="action-retry" type="button">Retry</button>
      <button class="button" id="action-mark" type="button">${markLabel}</button>`;
    $('action-retry').addEventListener('click', function () {
      doAction('retry', item.id);
    });
    $('action-mark').addEventListener('click', function () {
      doAction('mark', item.id);
    });
  }

  async function doAction(action, id) {
    const markPath =
      activeTab === 'outbox' ? 'mark-published' : 'mark-processed';
    const path = action === 'retry' ? 'retry' : markPath;
    const url = `${API_BASE}/${activeTab}/${id}/${path}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await fetchList();
      await loadDetail(id);
    } catch (err) {
      $('detail-actions').insertAdjacentHTML(
        'beforeend',
        `<span class="small">Action failed: ${escapeHtml(err.message)}</span>`,
      );
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    page = 1;
    selectedId = '';
    $('tab-outbox').classList.toggle('active', tab === 'outbox');
    $('tab-inbox').classList.toggle('active', tab === 'inbox');
    clearDetail();
    fetchList();
  }

  function init() {
    $('tab-outbox').addEventListener('click', function () {
      switchTab('outbox');
    });
    $('tab-inbox').addEventListener('click', function () {
      switchTab('inbox');
    });
    $('btn-refresh').addEventListener('click', fetchList);
    $('filter-mode').addEventListener('change', function () {
      page = 1;
      fetchList();
    });
    $('filter-topic').addEventListener('input', function () {
      page = 1;
      fetchList();
    });
    switchTab('outbox');
  }

  window.__capDashboard = { fetchList, loadDetail };
  document.addEventListener('DOMContentLoaded', init);
})();
