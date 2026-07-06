
    const bgScene   = document.getElementById('bgScene');
    const header    = document.getElementById('header');
    const logoMark  = document.getElementById('logoMark');
    const footer    = document.getElementById('footer');
    const hamburger = document.getElementById('hamburger');
    const sideNav   = document.getElementById('sideNav');
    const overlay   = document.getElementById('overlay');
    const pageHint  = document.getElementById('pageHint');
    const monogramGlowOverlay = document.getElementById('monogramGlowOverlay');
    const routeHome = document.querySelector('[data-view="home"]');
    const heroPointerGlow = document.getElementById('heroPointerGlow');
    const languageToggles = document.querySelectorAll('.language-toggle');
    const langButtons     = document.querySelectorAll('[data-lang]');
    const i18nElements   = document.querySelectorAll('[data-i18n]');
    const routeLinks     = document.querySelectorAll('[data-route]');
    const routeViews     = document.querySelectorAll('[data-view]');
    const galleryAccordion = document.getElementById('galleryAccordion');
    const galleryPanels    = document.querySelectorAll('.gallery-panel');
    const galleryImages    = document.querySelectorAll('.gallery-panel img[data-src]');
    const galleryDesktopQuery = window.matchMedia('(min-width: 641px)');
    const divisionDoors = document.querySelectorAll('.division-door');
    const divisionDoorsWrap = document.getElementById('divisionDoors');
    const divisionReturn = document.getElementById('divisionReturn');
    const deskTrigger = document.getElementById('deskTrigger');
    const deskPanel = document.getElementById('deskPanel');
    const deskScrim = document.getElementById('deskScrim');
    const deskClose = document.getElementById('deskClose');
    const deskThread = document.getElementById('deskThread');
    const deskEmpty = document.getElementById('deskEmpty');
    const deskComposer = document.getElementById('deskComposer');
    const deskMessageInput = document.getElementById('deskMessageInput');
    const deskSendMessage = document.getElementById('deskSendMessage');
    const deskComposerMeta = document.getElementById('deskComposerMeta');
    const internalSessionLine = document.getElementById('internalSessionLine');
    const internalSessionUser = document.getElementById('internalSessionUser');
    const internalSignOut = document.getElementById('internalSignOut');
    const internalMockSignInButtons = document.querySelectorAll('[data-internal-mock-sign-in]');
    const internalAuthForms = document.querySelectorAll('[data-internal-auth-form]');
    const internalAuthEmailInputs = document.querySelectorAll('[data-internal-email]');
    const internalAuthPasswordInputs = document.querySelectorAll('[data-internal-password]');
    const internalAuthSubmitButtons = document.querySelectorAll('[data-internal-auth-submit]');
    const internalAuthFeedbacks = document.querySelectorAll('[data-internal-auth-feedback]');
    const internalStatusElements = document.querySelectorAll('[data-internal-status]');

    const ROUTES = Object.freeze({
      HOME: 'home',
      GALLERY: 'gallery',
      DASHBOARD: 'dashboard',
      DIVISIONS: 'divisions',
      MARKETING: 'divisions/marketing',
      FINANCE: 'divisions/finance',
      OPERATIONS: 'divisions/operations'
    });

    const VALID_ROUTES = new Set(Object.values(ROUTES));
    const DIVISION_CHILD_ROUTES = new Set([
      ROUTES.MARKETING,
      ROUTES.FINANCE,
      ROUTES.OPERATIONS
    ]);

    const ROUTE_TITLES = Object.freeze({
      [ROUTES.HOME]: 'Moscatelli',
      [ROUTES.GALLERY]: 'Gallery — Moscatelli',
      [ROUTES.DASHBOARD]: 'Dashboard — Moscatelli',
      [ROUTES.DIVISIONS]: 'Divisions — Moscatelli',
      [ROUTES.MARKETING]: 'Marketing — Moscatelli',
      [ROUTES.FINANCE]: 'Finance — Moscatelli',
      [ROUTES.OPERATIONS]: 'Operations — Moscatelli'
    });

    const DESK_CONFIG = Object.freeze({
      provider: 'retired',
      state: 'retired',
      futureProvider: null,
      realtimeEnabled: false
    });

    const DESK_DATA_CONFIG = Object.freeze({
      table: 'desk_messages',
      channel: 'desk',
      primaryKey: 'id',
      ownerKey: 'created_by',
      createdAtKey: 'created_at',
      realtimeEvent: 'postgres_changes',
      realtimeEnabled: false,
      fields: Object.freeze([
        'id',
        'channel',
        'body',
        'created_by',
        'sender_display',
        'sender_role',
        'deleted_at',
        'deleted_by',
        'deleted_by_display',
        'created_at',
        'updated_at'
      ])
    });

    const DASHBOARD_DATA_CONFIG = Object.freeze({
      table: 'record_posts',
      attachmentsTable: 'record_attachments',
      primaryKey: 'id',
      ownerKey: 'created_by',
      createdAtKey: 'created_at',
      updatedAtKey: 'updated_at',
      deletePolicy: 'own_or_founder',
      defaultCategory: 'meetings',
      defaultChannel: 'record',
      maxAttachments: 4,
      realtimeEvent: 'postgres_changes',
      realtimeEnabled: true,
      fields: Object.freeze([
        'id',
        'channel',
        'category',
        'title',
        'body',
        'created_by',
        'created_at',
        'updated_at'
      ]),
      attachmentFields: Object.freeze([
        'id',
        'post_id',
        'path',
        'preview_url',
        'original_size',
        'resized_size',
        'mime_type',
        'created_by',
        'created_at'
      ])
    });

    const INTERNAL_ROLES = Object.freeze({
      founder: Object.freeze({
        canReadRecord: true,
        canCreateRecord: true,
        canDeleteOwnRecord: true,
        canDeleteAnyRecord: true,
        canUseDesk: false,
        canSendDeskMessage: false
      }),
      partner: Object.freeze({
        canReadRecord: true,
        canCreateRecord: true,
        canDeleteOwnRecord: true,
        canDeleteAnyRecord: false,
        canUseDesk: false,
        canSendDeskMessage: false
      }),
      member: Object.freeze({
        canReadRecord: true,
        canCreateRecord: true,
        canDeleteOwnRecord: true,
        canDeleteAnyRecord: false,
        canUseDesk: false,
        canSendDeskMessage: false
      })
    });

    const INTERNAL_CONFIG = Object.freeze({
      mode: 'supabase',
      supabaseEnabled: true,
      supabase: Object.freeze({
        url: 'https://htxzyqjynthuxrhnfcrj.supabase.co',
        anonKey: 'sb_publishable_TIHcoDVmM3gezwSce3SA6g_QY8clFCB',
        redirectTo: 'https://gianmoska-prog.github.io/MainHub/'
      }),
      auth: Object.freeze({
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }),
      protectedRoutes: Object.freeze([
        ROUTES.DASHBOARD,
        ROUTES.MARKETING,
        ROUTES.FINANCE,
        ROUTES.OPERATIONS
      ]),
      protectedFeatures: Object.freeze([
        'record',
        'division-pages'
      ]),
      dashboard: DASHBOARD_DATA_CONFIG,
      desk: DESK_DATA_CONFIG
    });

    const INTERNAL_MOCK_USER = Object.freeze({
      id: 'mock-founder-gianluca',
      displayName: 'Gianluca',
      role: 'founder',
      division: 'all',
      email: 'gianluca@moscatelli.local'
    });

    const InternalState = {
      mode: INTERNAL_CONFIG.mode,
      authStatus: 'signed_out',
      ready: false,
      user: null,
      session: null,
      supabaseClient: null,
      lastEventAt: null
    };

    const DeskRuntime = {
      loaded: false,
      subscribed: false,
      channel: DESK_DATA_CONFIG.channel,
      syncTimer: null,
      lastSignature: ''
    };

    const RealtimeRuntime = {
      deskChannel: null,
      dashboardChannel: null,
      attachmentChannel: null,
      dashboardRefreshTimer: null,
      deskRefreshTimer: null,
      status: 'idle'
    };

    const InternalData = (() => {
      const STORAGE_BUCKET = 'record-attachments';
      const SUPABASE_RECORD_LIMIT = 240;
      const SUPABASE_DESK_LIMIT = 300;

      const mockStore = {
        posts: new Map(),
        messages: [],
        attachments: new Map()
      };

      function dataEvent(type, detail = {}) {
        window.dispatchEvent(new CustomEvent(`moscatelli:data-${type}`, {
          detail: {
            mode: getInternalMode(),
            user: InternalState.user,
            ...detail
          }
        }));
      }

      function mockId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }

      function currentOwnerId() {
        return getCurrentInternalUser()?.id || INTERNAL_MOCK_USER.id;
      }

      function currentRolePolicy() {
        const role = getCurrentInternalUser()?.role || 'member';
        return INTERNAL_ROLES[role] || INTERNAL_ROLES.member;
      }

      function canCurrentUserModifyRecord(record) {
        const policy = currentRolePolicy();
        const isOwner = record?.created_by === currentOwnerId();

        return Boolean(policy.canDeleteAnyRecord || (policy.canDeleteOwnRecord && isOwner));
      }

      function canCurrentUserUseDesk() {
        const policy = currentRolePolicy();
        return Boolean(isInternalUserSignedIn() && policy.canUseDesk);
      }

      function canCurrentUserSendDeskMessage() {
        const policy = currentRolePolicy();
        return Boolean(isInternalUserSignedIn() && policy.canSendDeskMessage);
      }

      function activeSupabaseClient() {
        if (getInternalMode() !== 'supabase') return null;
        return createInternalSupabaseClient();
      }

      function supabaseFieldList(fields = []) {
        return fields.join(',');
      }

      function normalisePostPayload(payload = {}) {
        const now = payload.created_at || new Date().toISOString();
        const ownerId = payload.created_by || currentOwnerId();

        return {
          id: payload.id || mockId('post'),
          channel: payload.channel || DASHBOARD_DATA_CONFIG.defaultChannel,
          category: payload.category || DASHBOARD_DATA_CONFIG.defaultCategory,
          title: payload.title || 'Untitled entry',
          body: payload.body || '—',
          created_by: ownerId,
          created_at: now,
          updated_at: payload.updated_at || now
        };
      }

      function normaliseDeskMessagePayload(payload = {}) {
        const now = payload.created_at || new Date().toISOString();
        const user = getCurrentInternalUser() || INTERNAL_MOCK_USER;

        return {
          id: payload.id || mockId('message'),
          channel: payload.channel || DESK_DATA_CONFIG.channel,
          body: payload.body || '',
          created_by: payload.created_by || user.id,
          sender_display: payload.sender_display || user.displayName || 'Member',
          sender_role: payload.sender_role || user.role || 'member',
          deleted_at: payload.deleted_at || null,
          deleted_by: payload.deleted_by || null,
          deleted_by_display: payload.deleted_by_display || '',
          created_at: now,
          updated_at: payload.updated_at || now
        };
      }

      function normaliseAttachment(item = {}, postId = null) {
        const id = item.id || mockId('attachment');
        const mimeType = item.mimeType || item.mime_type || item.blob?.type || 'image/jpeg';

        return {
          id,
          post_id: postId,
          bucket: item.bucket || STORAGE_BUCKET,
          path: item.path || '',
          preview_url: item.previewUrl || item.preview_url || item.url || item.local_preview_url || '',
          local_preview_url: item.local_preview_url || item.url || '',
          original_size: item.originalSize || item.original_size || 0,
          resized_size: item.resizedSize || item.resized_size || item.blob?.size || 0,
          mime_type: mimeType,
          blob: item.blob || null,
          file_name: item.fileName || item.file_name || item.name || '',
          created_by: item.created_by || currentOwnerId(),
          created_at: item.createdAt || item.created_at || new Date().toISOString()
        };
      }

      function hydratePost(row, attachments = []) {
        const post = normalisePostPayload(row);

        return {
          ...post,
          owned: post.created_by === currentOwnerId(),
          can_delete: canCurrentUserModifyRecord(post),
          source: 'supabase',
          attachments
        };
      }

      function safeStorageFileName(item, index = 0) {
        const raw = item.file_name || item.name || `plate-${index + 1}.jpg`;
        const base = String(raw)
          .replace(/\.[a-z0-9]{2,5}$/i, '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9_-]+/gi, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 54) || `plate-${index + 1}`;

        return `${Date.now()}-${index + 1}-${base}.jpg`;
      }

      async function signedAttachmentUrl(client, path) {
        if (!client || !path) return '';

        const { data, error } = await client.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(path, 60 * 60);

        if (error) {
          dataEvent('attachment-signed-url-error', { error, path });
          return '';
        }

        return data?.signedUrl || '';
      }

      async function hydrateAttachmentRows(client, rows = []) {
        const hydrated = [];

        for (const row of rows) {
          const signedUrl = await signedAttachmentUrl(client, row.path);
          hydrated.push({
            ...normaliseAttachment(row, row.post_id),
            id: row.id,
            post_id: row.post_id,
            path: row.path,
            preview_url: signedUrl || row.preview_url || '',
            blob: null,
            source: 'supabase'
          });
        }

        return hydrated;
      }

      async function fetchAttachmentsForPosts(client, postIds = []) {
        if (!client || !postIds.length) return new Map();

        const { data, error } = await client
          .from(DASHBOARD_DATA_CONFIG.attachmentsTable)
          .select(supabaseFieldList(DASHBOARD_DATA_CONFIG.attachmentFields))
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        if (error) {
          dataEvent('attachments-list-error', { error, table: DASHBOARD_DATA_CONFIG.attachmentsTable });
          return new Map();
        }

        const rows = await hydrateAttachmentRows(client, data || []);
        return rows.reduce((map, item) => {
          if (!map.has(item.post_id)) map.set(item.post_id, []);
          map.get(item.post_id).push(item);
          return map;
        }, new Map());
      }

      async function persistPostAttachments(client, post, items = []) {
        const ownerId = post?.created_by || currentOwnerId();
        const persisted = [];
        const errors = [];

        for (const [index, sourceItem] of items.entries()) {
          const item = normaliseAttachment(sourceItem, post.id);
          if (!item.blob) continue;

          const path = `${ownerId}/${post.id}/${safeStorageFileName(item, index)}`;
          const upload = await client.storage
            .from(STORAGE_BUCKET)
            .upload(path, item.blob, {
              cacheControl: '3600',
              contentType: item.mime_type || 'image/jpeg',
              upsert: false
            });

          if (upload.error) {
            errors.push({ stage: 'storage_upload', path, error: upload.error });
            dataEvent('attachment-upload-error', { error: upload.error, path });
            continue;
          }

          const metadataPayload = {
            post_id: post.id,
            bucket: STORAGE_BUCKET,
            path,
            preview_url: null,
            original_size: item.original_size || 0,
            resized_size: item.resized_size || item.blob.size || 0,
            mime_type: item.mime_type || 'image/jpeg',
            created_by: ownerId
          };

          const { data, error } = await client
            .from(DASHBOARD_DATA_CONFIG.attachmentsTable)
            .insert(metadataPayload)
            .select(supabaseFieldList(DASHBOARD_DATA_CONFIG.attachmentFields))
            .single();

          if (error) {
            await client.storage.from(STORAGE_BUCKET).remove([path]);
            errors.push({ stage: 'metadata_insert', path, error });
            dataEvent('attachment-metadata-error', { error, path });
            continue;
          }

          const [hydrated] = await hydrateAttachmentRows(client, [data]);
          persisted.push({
            ...hydrated,
            preview_url: hydrated.preview_url || item.local_preview_url || ''
          });
        }

        return { attachments: persisted, errors };
      }

      const auth = {
        async getSession() {
          if (getInternalMode() !== 'supabase') {
            return {
              user: InternalState.user,
              session: InternalState.session,
              mode: getInternalMode()
            };
          }

          const client = createInternalSupabaseClient();
          if (!client) {
            return { user: null, session: null, mode: 'supabase', error: 'client_unavailable' };
          }

          const { data, error } = await client.auth.getSession();
          if (error) {
            dataEvent('auth-session-error', { error });
            return { user: null, session: null, mode: 'supabase', error };
          }

          const session = data?.session || null;
          const user = session?.user ? await profileFromSupabaseUser(session.user) : null;

          return { user, session, mode: 'supabase' };
        },

        async signInWithPassword(email, password) {
          if (getInternalMode() !== 'supabase') {
            const result = await this.signInMock(INTERNAL_MOCK_USER);
            return { ok: true, ...result };
          }

          const client = createInternalSupabaseClient();
          if (!client) {
            return { ok: false, error: 'client_unavailable' };
          }

          const { data, error } = await client.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            dataEvent('auth-password-error', { error });
            return { ok: false, error };
          }

          const session = data?.session || null;
          const user = data?.user ? await profileFromSupabaseUser(data.user) : null;

          dataEvent('auth-password-sign-in', { email, user, session });
          return { ok: true, email, user, session };
        },

        async signInMock(user = INTERNAL_MOCK_USER) {
          const session = {
            id: mockId('session'),
            provider: 'mock',
            startedAt: new Date().toISOString(),
            persistSession: INTERNAL_CONFIG.auth.persistSession
          };

          dataEvent('auth-sign-in', { user, session });
          return { user, session };
        },

        async signOut() {
          if (getInternalMode() === 'supabase') {
            const client = createInternalSupabaseClient();
            if (client) await client.auth.signOut();
          }

          dataEvent('auth-sign-out');
          return { ok: true };
        }
      };

      const posts = {
        async list(filters = {}) {
          const category = filters.category || 'all';
          const client = activeSupabaseClient();

          if (!client) {
            const values = Array.from(mockStore.posts.values());
            return values
              .filter(post => category === 'all' || post.category === category)
              .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
          }

          let query = client
            .from(DASHBOARD_DATA_CONFIG.table)
            .select(supabaseFieldList(DASHBOARD_DATA_CONFIG.fields))
            .eq('channel', filters.channel || DASHBOARD_DATA_CONFIG.defaultChannel)
            .order('created_at', { ascending: false })
            .limit(SUPABASE_RECORD_LIMIT);

          if (category !== 'all') query = query.eq('category', category);

          const { data, error } = await query;
          if (error) {
            dataEvent('posts-list-error', { error, table: DASHBOARD_DATA_CONFIG.table });
            return [];
          }

          const rows = data || [];
          const attachmentsByPost = await fetchAttachmentsForPosts(client, rows.map(row => row.id));
          return rows.map(row => hydratePost(row, attachmentsByPost.get(row.id) || []));
        },

        async create(payload = {}) {
          if (!isInternalUserSignedIn()) {
            dataEvent('post-create-error', { error: 'not_signed_in' });
            return null;
          }

          const client = activeSupabaseClient();

          if (!client) {
            const basePost = normalisePostPayload(payload);
            const attachments = (payload.attachments || []).map(item => normaliseAttachment(item, basePost.id));

            const post = {
              ...basePost,
              owned: basePost.created_by === currentOwnerId(),
              can_delete: canCurrentUserModifyRecord(basePost),
              source: getInternalMode(),
              attachments
            };

            mockStore.posts.set(post.id, post);
            attachments.forEach(item => mockStore.attachments.set(item.id, item));
            dataEvent('post-created', { post, table: DASHBOARD_DATA_CONFIG.table });
            return post;
          }

          const postPayload = {
            channel: payload.channel || DASHBOARD_DATA_CONFIG.defaultChannel,
            category: payload.category || DASHBOARD_DATA_CONFIG.defaultCategory,
            title: payload.title || 'Untitled entry',
            body: payload.body || '—',
            created_by: currentOwnerId()
          };

          const { data, error } = await client
            .from(DASHBOARD_DATA_CONFIG.table)
            .insert(postPayload)
            .select(supabaseFieldList(DASHBOARD_DATA_CONFIG.fields))
            .single();

          if (error || !data) {
            dataEvent('post-create-error', { error, table: DASHBOARD_DATA_CONFIG.table });
            return null;
          }

          const uploadResult = await persistPostAttachments(client, data, payload.attachments || []);
          const post = hydratePost(data, uploadResult.attachments);
          post.attachment_errors = uploadResult.errors;

          dataEvent('post-created', { post, table: DASHBOARD_DATA_CONFIG.table, attachmentErrors: uploadResult.errors });
          return post;
        },

        async remove(postId) {
          const client = activeSupabaseClient();

          if (!client) {
            const post = mockStore.posts.get(postId);

            if (!post) {
              return { ok: false, error: 'not_found' };
            }

            if (!canCurrentUserModifyRecord(post)) {
              return { ok: false, error: 'not_authorized' };
            }

            mockStore.posts.delete(postId);
            post.attachments?.forEach(item => mockStore.attachments.delete(item.id));
            dataEvent('post-deleted', { postId, post, table: DASHBOARD_DATA_CONFIG.table });
            return { ok: true, post };
          }

          const { data: attachmentRows, error: attachmentError } = await client
            .from(DASHBOARD_DATA_CONFIG.attachmentsTable)
            .select('path')
            .eq('post_id', postId);

          if (attachmentError) {
            dataEvent('post-delete-attachment-list-error', { error: attachmentError, postId });
            return { ok: false, error: attachmentError };
          }

          const paths = (attachmentRows || []).map(item => item.path).filter(Boolean);
          if (paths.length) {
            const { error: storageError } = await client.storage.from(STORAGE_BUCKET).remove(paths);
            if (storageError) {
              dataEvent('post-delete-storage-error', { error: storageError, postId, paths });
              return { ok: false, error: storageError };
            }
          }

          const { data, error } = await client
            .from(DASHBOARD_DATA_CONFIG.table)
            .delete()
            .eq('id', postId)
            .select(supabaseFieldList(DASHBOARD_DATA_CONFIG.fields))
            .maybeSingle();

          if (error) {
            dataEvent('post-delete-error', { error, postId });
            return { ok: false, error };
          }

          dataEvent('post-deleted', { postId, post: data, table: DASHBOARD_DATA_CONFIG.table });
          return { ok: true, post: data };
        },

        permissions(record) {
          return {
            owned: record?.created_by === currentOwnerId(),
            can_delete: canCurrentUserModifyRecord(record),
            policy: DASHBOARD_DATA_CONFIG.deletePolicy
          };
        }
      };

      const messages = {
        fromRealtime(row = {}) {
          if (!row) return null;

          return {
            ...normaliseDeskMessagePayload(row),
            id: row.id,
            sender_display: row.sender_display || 'Member',
            sender_role: row.sender_role || 'member',
            source: 'supabase-realtime'
          };
        },

        async list(filters = {}) {
          const channel = filters.channel || DESK_DATA_CONFIG.channel;
          const client = activeSupabaseClient();

          if (!client) {
            return mockStore.messages
              .filter(message => message.channel === channel)
              .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
          }

          const { data, error } = await client
            .from(DESK_DATA_CONFIG.table)
            .select(supabaseFieldList(DESK_DATA_CONFIG.fields))
            .eq('channel', channel)
            .order('created_at', { ascending: true })
            .limit(SUPABASE_DESK_LIMIT);

          if (error) {
            dataEvent('messages-list-error', { error, table: DESK_DATA_CONFIG.table });
            return [];
          }

          return (data || []).map(message => ({
            ...normaliseDeskMessagePayload(message),
            id: message.id,
            sender_display: message.sender_display || 'Member',
            sender_role: message.sender_role || 'member',
            source: 'supabase'
          }));
        },

        async send(payload = {}) {
          if (!canCurrentUserSendDeskMessage()) {
            return { ok: false, error: 'not_authorized' };
          }

          const client = activeSupabaseClient();

          if (!client) {
            const message = {
              ...normaliseDeskMessagePayload(payload),
              owned: true,
              source: getInternalMode()
            };

            mockStore.messages.push(message);
            dataEvent('message-created', { message, table: DESK_DATA_CONFIG.table });
            return { ok: true, message };
          }

          const messagePayload = {
            channel: payload.channel || DESK_DATA_CONFIG.channel,
            body: payload.body || '',
            created_by: currentOwnerId()
          };

          const { data, error } = await client
            .from(DESK_DATA_CONFIG.table)
            .insert(messagePayload)
            .select(supabaseFieldList(DESK_DATA_CONFIG.fields))
            .single();

          if (error || !data) {
            dataEvent('message-create-error', { error, table: DESK_DATA_CONFIG.table });
            return { ok: false, error };
          }

          const message = {
            ...normaliseDeskMessagePayload(data),
            id: data.id,
            sender_display: data.sender_display || getCurrentInternalUser()?.displayName || 'Member',
            sender_role: data.sender_role || getCurrentInternalUser()?.role || 'member',
            source: 'supabase'
          };

          dataEvent('message-created', { message, table: DESK_DATA_CONFIG.table });
          return { ok: true, message };
        },

        async remove(messageId) {
          if (!messageId || !canCurrentUserUseDesk()) {
            return { ok: false, error: 'not_authorized' };
          }

          const client = activeSupabaseClient();

          if (!client) {
            const message = mockStore.messages.find(item => item.id === messageId);
            if (!message) return { ok: false, error: 'not_found' };

            if (message.created_by !== currentOwnerId() && !isCurrentUserFounder()) {
              return { ok: false, error: 'not_authorized' };
            }

            message.body = '';
            message.deleted_at = new Date().toISOString();
            message.deleted_by = currentOwnerId();
            message.deleted_by_display = getCurrentInternalUser()?.displayName || 'Member';
            message.updated_at = message.deleted_at;

            dataEvent('message-deleted', { message, table: DESK_DATA_CONFIG.table });
            return { ok: true, message };
          }

          const { data, error } = await client
            .from(DESK_DATA_CONFIG.table)
            .update({
              body: '',
              deleted_at: new Date().toISOString(),
              deleted_by: currentOwnerId()
            })
            .eq(DESK_DATA_CONFIG.primaryKey, messageId)
            .select(supabaseFieldList(DESK_DATA_CONFIG.fields))
            .single();

          if (error || !data) {
            dataEvent('message-delete-error', { error, messageId, table: DESK_DATA_CONFIG.table });
            return { ok: false, error };
          }

          const message = {
            ...normaliseDeskMessagePayload(data),
            id: data.id,
            sender_display: data.sender_display || 'Member',
            sender_role: data.sender_role || 'member',
            deleted_by_display: data.deleted_by_display || '',
            source: 'supabase'
          };

          dataEvent('message-deleted', { message, table: DESK_DATA_CONFIG.table });
          return { ok: true, message };
        },

        permissions(message = null) {
          const owned = message?.created_by === currentOwnerId();
          const canDelete = Boolean(
            message
            && !message.deleted_at
            && canCurrentUserUseDesk()
            && (owned || isCurrentUserFounder())
          );

          return {
            can_use: canCurrentUserUseDesk(),
            can_send: canCurrentUserSendDeskMessage(),
            can_delete: canDelete,
            owned,
            channel: DESK_DATA_CONFIG.channel
          };
        },

        _legacyPermissions() {
          return {
            can_use: canCurrentUserUseDesk(),
            can_send: canCurrentUserSendDeskMessage(),
            channel: DESK_DATA_CONFIG.channel
          };
        }
      };

      const attachments = {
        async fromComposer(items = []) {
          return items.map(item => normaliseAttachment(item));
        },

        async refreshSignedUrl(path) {
          const client = activeSupabaseClient();
          if (!client || !path) return '';
          return signedAttachmentUrl(client, path);
        },

        async cleanupBlobUrls(urls = []) {
          urls.forEach(url => {
            if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
          });

          dataEvent('attachments-cleaned', { count: urls.length });
          return { ok: true };
        }
      };

      return Object.freeze({
        mode: () => getInternalMode(),
        store: mockStore,
        auth,
        posts,
        messages,
        attachments
      });
    })();
    let galleryPreloadPromise = null;
    let galleryWarmupScheduled = false;
    let galleryImagesReady = false;
    let currentLang      = 'en';
    let currentRoute     = null;
    let navStaggerTimer  = null;
    let galleryCaptionTimer = null;

    const translations = {
      en: {
        'nav.label': 'Navigation',
        'nav.home': 'Home',
        'nav.collections': 'Collections',
        'nav.atelier': 'Atelier',
        'nav.gallery': 'Gallery',
        'nav.dashboard': 'Dashboard',
        'dashboard.title': 'The Record',
        'dashboard.kicker': 'Internal Ledger',
        'dashboard.brief': 'A private register for proceedings, studies, decisions, materials and the work of the maison.',
        'dashboard.filter': 'Index',
        'dashboard.all': 'All',
        'dashboard.newEntry': 'New Record',
        'dashboard.localOnly': 'Private Entry',
        'dashboard.titlePlaceholder': 'Title',
        'dashboard.bodyPlaceholder': 'Write a measured internal note...',
        'dashboard.attach': 'Attach plates',
        'dashboard.attachLimit': 'Maximum four images.',
        'dashboard.commit': 'Enter into the Record',
        'dashboard.recording': 'Entering…',
        'dashboard.recorded': 'Entered into the Record',
        'dashboard.feedback.empty': 'Add a title or note before entering the Record.',
        'dashboard.feedback.auth': 'Sign in again before entering the Record.',
        'dashboard.feedback.error': 'The entry could not be recorded. Please try again.',
        'dashboard.feedback.attachErrors': 'Entry recorded, but one or more plates could not be attached.',
        'dashboard.feedback.attachInvalid': 'Only image files may be attached.',
        'dashboard.feedback.attachLimit': 'Only four plates may be attached.',
        'dashboard.feedback.attachResize': 'One plate could not be prepared for preview.',
        'dashboard.viewerTitle': 'Record Plate',
        'dashboard.viewerUnavailable': 'This plate could not be re-opened. Refresh the Record and try again.',
        'dashboard.delete': 'Delete',
        'dashboard.deleted': 'Entry deleted',
        'dashboard.empty': 'No records in this index.',
        'dashboard.untitled': 'Untitled entry',
        'dashboard.authorLocal': 'Local draft · Not saved',
        'dashboard.authorSupabase': 'Entered in the Register',
        'dashboard.resizeNote': 'Plates are resized locally before preview.',
        'dashboard.cat.meetings': 'Proceedings',
        'dashboard.cat.ideas': 'Studies',
        'dashboard.cat.decisions': 'Decisions',
        'dashboard.cat.tasks': 'Directives',
        'dashboard.cat.product': 'Materials',
        'dashboard.cat.brand': 'House',
        'dashboard.cat.finance': 'Accounts',
        'dashboard.cat.operations': 'Operations',
        'nav.divisions': 'Divisions',
        'divisions.marketing': 'Marketing',
        'divisions.finance': 'Finance',
        'divisions.operations': 'Operations',
        'divisions.kicker': 'Institutional Wings',
        'divisions.title': 'The Divisions',
        'divisions.note': 'Three internal offices for the measured work of the maison.',
        'divisions.marketingRole': 'Commercial Office',
        'divisions.financeRole': 'Accounts Office',
        'divisions.operationsRole': 'Execution Office',
        'ui.return': 'Return',
        'ui.desk': 'The Desk',
        'desk.kicker': 'Internal Correspondence',
        'desk.intro': 'A private place for correspondence, decisions, and the quiet work of the maison.',
        'global.kicker': 'Private Threshold',
        'global.copy': 'Enter with your maison credentials to continue.',
        'global.enter': 'Enter',
        'internal.kicker': 'Private Access',
        'internal.recordTitle': 'The Record',
        'internal.recordIntro': 'This ledger belongs to the internal work of the maison.',
        'internal.deskTitle': 'The Desk',
        'internal.deskIntro': 'Internal correspondence is reserved for authenticated members of the maison.',
        'internal.divisionIntro': 'This division page is reserved for authenticated members of the maison.',
        'internal.route.public': 'Public area',
        'internal.route.protected': 'Private area',
        'internal.dataMode': 'Mock data layer',
        'internal.recordSource.mock': 'Mock record',
        'internal.recordSource.supabase': 'Live record',
        'internal.mockAccess': 'Enter in mock mode',
        'internal.emailLabel': 'Email',
        'internal.emailPlaceholder': 'name@moscatelli.co',
        'internal.passwordLabel': 'Password',
        'internal.passwordPlaceholder': 'Password',
        'internal.enter': 'Enter',
        'internal.signOut': 'Sign out',
        'internal.signedInAs': 'Signed in as',
        'internal.status.signedOut': 'Authentication required',
        'internal.status.checking': 'Verifying access…',
        'internal.status.signedIn': 'Access granted',
        'internal.status.linkSent': 'Access link sent. Check your email.',
        'internal.status.configError': 'Connection unavailable. Check Supabase settings.',
        'internal.status.authError': 'Access denied. Check the email and password.',
        'internal.status.inactive': 'Profile not active yet.',
        'desk.composer': 'Correspondence field',
        'desk.placeholder': 'Write a quiet correspondence…',
        'desk.send': 'SEND',
        'desk.empty': 'No correspondence has been entered.',
        'desk.local': 'Local message',
        'desk.locked': 'Sign in to write.',
        'desk.ready': 'Ready for internal correspondence.',
        'desk.delete': 'Delete',
        'desk.deletedMessage': '{user} deleted a message',
        'footer.rights': 'All rights reserved',
        'footer.privacy': 'Privacy',
        'aria.openMenu': 'Open menu',
        'aria.closeMenu': 'Close menu',
        'aria.language': 'Language selector',
        'gallery.caption.1': 'Baby alpaca scarf in Bianco Avorio (Ivory White) - Concept',
        'gallery.caption.2': 'Baby alpaca scarf in Bianco Avorio (Ivory White) - Editorial concept',
        'gallery.caption.3': 'Baby alpaca scarf in Terra Bruna (Chocolate Brown) - Editorial concept',
        'gallery.caption.4': 'Founder Double Breasted suit - Concept',
        'gallery.caption.5': 'Moscatelli Parfums - Concept',
        'gallery.caption.6': 'Moscatelli Lotto II - Cinematic concept',
        'gallery.caption.7': 'Gianluca Moscatelli - Founder portrait'
      },
      pt: {
        'nav.label': 'Navegação',
        'nav.home': 'Início',
        'nav.collections': 'Coleções',
        'nav.atelier': 'Ateliê',
        'nav.gallery': 'Galeria',
        'nav.dashboard': 'Painel',
        'dashboard.title': 'O Registro',
        'dashboard.kicker': 'Registro Interno',
        'dashboard.brief': 'Um registro privado para atas, estudos, decisões, materiais e o trabalho da maison.',
        'dashboard.filter': 'Filtrar',
        'dashboard.all': 'Tudo',
        'dashboard.newEntry': 'Nova Entrada',
        'dashboard.localOnly': 'Entrada privada',
        'dashboard.titlePlaceholder': 'Título',
        'dashboard.bodyPlaceholder': 'Escreva uma breve nota interna...',
        'dashboard.attach': 'Anexar pranchas',
        'dashboard.attachLimit': 'Máximo de quatro imagens.',
        'dashboard.commit': 'Registrar no Livro',
        'dashboard.recording': 'Inscrevendo…',
        'dashboard.recorded': 'Registro inscrito',
        'dashboard.feedback.empty': 'Adicione um título ou uma nota antes de registrar.',
        'dashboard.feedback.auth': 'Entre novamente antes de registrar.',
        'dashboard.feedback.error': 'Não foi possível registrar a entrada. Tente novamente.',
        'dashboard.feedback.attachErrors': 'Registro salvo, mas uma ou mais pranchas não puderam ser anexadas.',
        'dashboard.feedback.attachInvalid': 'Somente imagens podem ser anexadas.',
        'dashboard.feedback.attachLimit': 'Somente quatro pranchas podem ser anexadas.',
        'dashboard.feedback.attachResize': 'Uma prancha não pôde ser preparada para pré-visualização.',
        'dashboard.viewerTitle': 'Prancha do Registro',
        'dashboard.viewerUnavailable': 'Esta prancha não pôde ser reaberta. Atualize o Registro e tente novamente.',
        'dashboard.delete': 'Apagar',
        'dashboard.deleted': 'Entrada apagada',
        'dashboard.empty': 'Nenhum registro neste índice.',
        'dashboard.untitled': 'Entrada sem título',
        'dashboard.authorLocal': 'Rascunho local · Não salvo',
        'dashboard.authorSupabase': 'Inscrito no Registro',
        'dashboard.resizeNote': 'As imagens são redimensionadas localmente antes da pré-visualização.',
        'dashboard.cat.meetings': 'Atas',
        'dashboard.cat.ideas': 'Estudos',
        'dashboard.cat.decisions': 'Decisões',
        'dashboard.cat.tasks': 'Diretrizes',
        'dashboard.cat.product': 'Materiais',
        'dashboard.cat.brand': 'Casa',
        'dashboard.cat.finance': 'Contas',
        'dashboard.cat.operations': 'Operações',
        'nav.divisions': 'Divisões',
        'divisions.marketing': 'Marketing',
        'divisions.finance': 'Finanças',
        'divisions.operations': 'Operações',
        'divisions.kicker': 'Alas Institucionais',
        'divisions.title': 'As Divisões',
        'divisions.note': 'Três áreas internas para o trabalho medido da maison.',
        'divisions.marketingRole': 'Ofício Comercial',
        'divisions.financeRole': 'Ofício de Contas',
        'divisions.operationsRole': 'Ofício de Execução',
        'ui.return': 'Voltar',
        'ui.desk': 'Correspondência',
        'desk.kicker': 'Correspondência Interna',
        'desk.intro': 'Um espaço privado para mensagens, decisões e o trabalho silencioso da maison.',
        'global.kicker': 'Acesso Privado',
        'global.copy': 'Entre com suas credenciais da maison para continuar.',
        'global.enter': 'Entrar',
        'internal.kicker': 'Acesso Privado',
        'internal.recordTitle': 'O Registro',
        'internal.recordIntro': 'Este registro pertence ao trabalho interno da maison.',
        'internal.deskTitle': 'Correspondência',
        'internal.deskIntro': 'A correspondência interna é reservada aos membros autenticados da maison.',
        'internal.divisionIntro': 'Esta divisão é reservada aos membros autenticados da maison.',
        'internal.route.public': 'Área pública',
        'internal.route.protected': 'Área privada',
        'internal.dataMode': 'Camada de dados local',
        'internal.recordSource.mock': 'Registro local',
        'internal.recordSource.supabase': 'Registro ativo',
        'internal.mockAccess': 'Entrar em modo local',
        'internal.emailLabel': 'Email',
        'internal.emailPlaceholder': 'nome@moscatelli.co',
        'internal.passwordLabel': 'Senha',
        'internal.passwordPlaceholder': 'Senha',
        'internal.enter': 'Entrar',
        'internal.signOut': 'Sair',
        'internal.signedInAs': 'Sessão de',
        'internal.status.signedOut': 'Autenticação necessária',
        'internal.status.checking': 'Verificando acesso…',
        'internal.status.signedIn': 'Acesso concedido',
        'internal.status.linkSent': 'Link de acesso enviado. Verifique seu email.',
        'internal.status.configError': 'Conexão indisponível. Verifique o Supabase.',
        'internal.status.authError': 'Acesso recusado. Verifique email e senha.',
        'internal.status.inactive': 'Perfil ainda não está ativo.',
        'desk.composer': 'Campo de correspondência',
        'desk.placeholder': 'Escreva uma correspondência discreta…',
        'desk.send': 'ENVIAR',
        'desk.empty': 'Ainda não há correspondência.',
        'desk.local': 'Mensagem local',
        'desk.locked': 'Entre para escrever.',
        'desk.ready': 'Pronto para correspondência interna.',
        'desk.delete': 'Apagar',
        'desk.deletedMessage': '{user} apagou uma mensagem',
        'footer.rights': 'Todos os direitos reservados',
        'footer.privacy': 'Privacidade',
        'aria.openMenu': 'Abrir menu',
        'aria.closeMenu': 'Fechar menu',
        'aria.language': 'Seletor de idioma',
        'gallery.caption.1': 'Cachecol de baby alpaca em Bianco Avorio (Branco Marfim) - Conceito',
        'gallery.caption.2': 'Cachecol de baby alpaca em Bianco Avorio (Branco Marfim) - Conceito editorial',
        'gallery.caption.3': 'Cachecol de baby alpaca em Terra Bruna (Castanho Chocolate) - Conceito editorial',
        'gallery.caption.4': 'Terno de abotoamento duplo do fundador - Conceito',
        'gallery.caption.5': 'Moscatelli Parfums - Conceito',
        'gallery.caption.6': 'Moscatelli Lotto II - Conceito cinematográfico',
        'gallery.caption.7': 'Gianluca Moscatelli - Retrato do fundador'
      }
    };

    // ── Gallery image preparation ──
    // Desktop gallery images are fetched and decoded quietly before the Gallery is revealed.
    function hydrateGalleryImage(img) {
      if (!img || img.dataset.loaded === 'true') return Promise.resolve(img);
      const src = img.dataset.src;
      if (!src) return Promise.resolve(img);

      return new Promise(resolve => {
        const preload = new Image();
        preload.decoding = 'async';
        preload.onload = () => {
          img.src = src;
          const markLoaded = () => {
            img.dataset.loaded = 'true';
            img.closest('.gallery-panel')?.classList.add('is-image-loaded');
            resolve(img);
          };
          if (img.decode) {
            img.decode().then(markLoaded).catch(markLoaded);
          } else {
            markLoaded();
          }
        };
        preload.onerror = () => {
          img.src = src;
          img.dataset.loaded = 'true';
          img.closest('.gallery-panel')?.classList.add('is-image-loaded');
          resolve(img);
        };
        preload.src = src;
      });
    }

    function preloadGalleryImages() {
      if (!galleryDesktopQuery.matches || !galleryImages.length) return Promise.resolve(true);
      if (galleryPreloadPromise) return galleryPreloadPromise;

      galleryPreloadPromise = Promise.all(Array.from(galleryImages, hydrateGalleryImage)).then(() => {
        galleryImagesReady = true;
        galleryAccordion?.classList.add('is-ready');
        return true;
      });
      return galleryPreloadPromise;
    }

    function waitForGalleryImages(maxWait = 1200) {
      if (galleryImagesReady || !galleryDesktopQuery.matches) return Promise.resolve(true);
      return Promise.race([
        preloadGalleryImages(),
        new Promise(resolve => setTimeout(() => resolve(false), maxWait))
      ]);
    }

    function scheduleGalleryWarmup(delay = 0) {
      if (!galleryDesktopQuery.matches || galleryImagesReady || galleryWarmupScheduled) return;
      galleryWarmupScheduled = true;

      const runWarmup = () => {
        galleryWarmupScheduled = false;
        if (!galleryDesktopQuery.matches || galleryImagesReady) return;

        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => preloadGalleryImages(), { timeout: 1800 });
        } else {
          setTimeout(preloadGalleryImages, 420);
        }
      };

      if (delay > 0) {
        setTimeout(runWarmup, delay);
      } else {
        runWarmup();
      }
    }

    // ── Main-content routing ──
    function internalAccessEvent(type, detail = {}) {
      InternalState.lastEventAt = new Date().toISOString();
      window.dispatchEvent(new CustomEvent(`moscatelli:internal-${type}`, {
        detail: {
          mode: InternalState.mode,
          authStatus: InternalState.authStatus,
          ready: InternalState.ready,
          user: InternalState.user,
          ...detail
        }
      }));
    }

    function isInternalSupabaseEnabled() {
      return Boolean(
        INTERNAL_CONFIG.supabaseEnabled &&
        INTERNAL_CONFIG.supabase.url &&
        INTERNAL_CONFIG.supabase.anonKey
      );
    }

    function createInternalSupabaseClient() {
      if (!isInternalSupabaseEnabled()) return null;
      if (InternalState.supabaseClient) return InternalState.supabaseClient;

      const factory = window.supabase?.createClient;
      if (!factory) {
        internalAccessEvent('supabase-client-missing', { url: INTERNAL_CONFIG.supabase.url });
        return null;
      }

      InternalState.supabaseClient = factory(
        INTERNAL_CONFIG.supabase.url,
        INTERNAL_CONFIG.supabase.anonKey,
        {
          auth: {
            persistSession: INTERNAL_CONFIG.auth.persistSession,
            autoRefreshToken: INTERNAL_CONFIG.auth.autoRefreshToken,
            detectSessionInUrl: INTERNAL_CONFIG.auth.detectSessionInUrl
          }
        }
      );

      return InternalState.supabaseClient;
    }

    async function profileFromSupabaseUser(authUser) {
      if (!authUser) return null;

      const fallback = {
        id: authUser.id,
        email: authUser.email || '',
        displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Member',
        role: 'member',
        division: 'all',
        isActive: false,
        provider: 'supabase'
      };

      const client = createInternalSupabaseClient();
      if (!client) return fallback;

      const { data, error } = await client
        .from('profiles')
        .select('id,email,display_name,role,division,is_active')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error || !data) {
        internalAccessEvent('profile-missing', { error, userId: authUser.id });
        return fallback;
      }

      return {
        id: data.id,
        email: data.email || authUser.email || '',
        displayName: data.display_name || fallback.displayName,
        role: data.role || 'member',
        division: data.division || 'all',
        isActive: Boolean(data.is_active),
        provider: 'supabase'
      };
    }

    function getInternalMode() {
      return isInternalSupabaseEnabled() ? 'supabase' : 'mock';
    }

    function getCurrentInternalUser() {
      return InternalState.user;
    }

    function isInternalUserSignedIn() {
      return Boolean(InternalState.user && InternalState.authStatus === 'signed_in');
    }

    function setInternalAuthStatus(status) {
      InternalState.authStatus = status;
      document.body.dataset.internalAuth = status;
      internalAccessEvent('auth-status', { status });
    }

    function setInternalReadyState(isReady) {
      InternalState.ready = Boolean(isReady);
      document.body.dataset.internalReady = String(Boolean(isReady));
      internalAccessEvent('ready', { ready: InternalState.ready });
    }

    function setInternalUser(user, session = null) {
      if (user && user.provider === 'supabase' && !user.isActive) {
        InternalState.user = null;
        InternalState.session = null;
        setInternalAuthStatus('inactive');

        const client = createInternalSupabaseClient();
        if (client?.auth?.signOut) {
          Promise.resolve(client.auth.signOut()).catch(error => {
            internalAccessEvent('inactive-signout-error', { error });
          });
        }

        internalAccessEvent('inactive-user', { user });
        return;
      }

      InternalState.user = user || null;
      InternalState.session = session;
      setInternalAuthStatus(user ? 'signed_in' : 'signed_out');
      internalAccessEvent('user', { user: InternalState.user });
    }

    function clearInternalUser() {
      InternalState.user = null;
      InternalState.session = null;
      setInternalAuthStatus('signed_out');
      internalAccessEvent('sign-out');
    }

    function unlockInternalAreas() {
      if (!isInternalUserSignedIn()) {
        lockInternalAreas();
        internalAccessEvent('unlock-blocked', { reason: 'not_signed_in' });
        return false;
      }

      document.body.classList.add('internal-unlocked');
      document.body.classList.remove('internal-locked');
      internalAccessEvent('unlock');
      return true;
    }

    function lockInternalAreas() {
      document.body.classList.add('internal-locked');
      document.body.classList.remove('internal-unlocked');
      internalAccessEvent('lock');
    }

    function isInternalRoute(route) {
      const targetRoute = normaliseRoute(route);
      return INTERNAL_CONFIG.protectedRoutes.includes(targetRoute);
    }

    function internalFeatureForRoute(route) {
      const targetRoute = normaliseRoute(route);

      if (targetRoute === ROUTES.DASHBOARD) return 'record';
      if (targetRoute === ROUTES.MARKETING) return 'division-marketing';
      if (targetRoute === ROUTES.FINANCE) return 'division-finance';
      if (targetRoute === ROUTES.OPERATIONS) return 'division-operations';

      return 'public';
    }

    function updateInternalGateVisibility() {
      const shouldShowGates = !isInternalUserSignedIn();

      document.querySelectorAll('[data-internal-gate]').forEach(gate => {
        const parentRoute = gate.closest('[data-view]')?.dataset.view || null;
        const isDeskGate = gate.dataset.internalGate === 'desk';
        const belongsToCurrentRoute = parentRoute ? parentRoute === currentRoute : false;
        const visible = shouldShowGates && (isDeskGate || belongsToCurrentRoute);

        gate.setAttribute('aria-hidden', String(!visible));
      });
    }

    function applyInternalRouteProtection(route = currentRoute) {
      const targetRoute = normaliseRoute(route || ROUTES.HOME);
      const routeIsProtected = isInternalRoute(targetRoute);
      const feature = internalFeatureForRoute(targetRoute);

      document.body.dataset.internalRoute = routeIsProtected ? 'protected' : 'public';
      document.body.dataset.internalFeature = feature;
      document.body.classList.toggle('internal-route-protected', routeIsProtected);
      document.body.classList.toggle('internal-route-public', !routeIsProtected);

      if (isInternalUserSignedIn()) {
        unlockInternalAreas();
      } else {
        lockInternalAreas();
      }

      updateInternalGateVisibility();
      internalAccessEvent('route-protection', {
        route: targetRoute,
        feature,
        protected: routeIsProtected,
        signedIn: isInternalUserSignedIn()
      });
    }

    async function mockSignInInternalUser(user = INTERNAL_MOCK_USER) {
      const result = await InternalData.auth.signInMock(user);
      setInternalUser(result.user, result.session);
      unlockInternalAreas();
      return InternalState.user;
    }

    async function mockSignOutInternalUser() {
      await InternalData.auth.signOut();
      clearInternalUser();
      lockInternalAreas();
    }

    async function initInternalAccessLayer() {
      InternalState.mode = getInternalMode();
      document.body.dataset.internalMode = InternalState.mode;

      if (InternalState.mode === 'mock') {
        setInternalAuthStatus('signed_out');
        setInternalReadyState(true);
        lockInternalAreas();
        internalAccessEvent('mock-ready', { config: INTERNAL_CONFIG });
        return;
      }

      setInternalAuthStatus('checking');
      setInternalReadyState(false);

      const client = createInternalSupabaseClient();
      if (!client) {
        setInternalAuthStatus('config_error');
        setInternalReadyState(true);
        lockInternalAreas();
        updateInternalAccessUI();
        internalAccessEvent('supabase-client-unavailable', { config: INTERNAL_CONFIG });
        return;
      }

      const sessionResult = await InternalData.auth.getSession();
      if (sessionResult.user) {
        setInternalUser(sessionResult.user, sessionResult.session);
        unlockInternalAreas();
        restorePendingInternalRoute();
        clearSupabaseAuthCallbackUrl(currentRoute || routeFromHash());
      } else {
        clearInternalUser();
        lockInternalAreas();
        clearSupabaseAuthCallbackUrl(currentRoute || ROUTES.HOME);
      }

      setInternalReadyState(true);
      updateInternalAccessUI();
      applyInternalRouteProtection(currentRoute || routeFromHash());
      internalAccessEvent('supabase-ready', { user: InternalState.user });

      client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user = await profileFromSupabaseUser(session.user);
          setInternalUser(user, session);
          unlockInternalAreas();
          restorePendingInternalRoute();
          clearSupabaseAuthCallbackUrl(currentRoute || routeFromHash());
        } else {
          clearInternalUser();
          lockInternalAreas();
          clearSupabaseAuthCallbackUrl(currentRoute || ROUTES.HOME);
        }

        updateInternalAccessUI();
        applyInternalRouteProtection(currentRoute || routeFromHash());
      });
    }

    window.MoscatelliInternal = Object.freeze({
      getBuild: () => 'patch3e-overall-stability-balance',
      getMode: getInternalMode,
      isSignedIn: isInternalUserSignedIn,
      getCurrentUser: () => {
        const user = getCurrentInternalUser();
        return user ? Object.freeze({ ...user }) : null;
      },
      getStatus: () => Object.freeze({
        authStatus: InternalState.authStatus,
        ready: InternalState.ready,
        route: currentRoute,
        mode: getInternalMode(),
        deskOpen: document.body.classList.contains('desk-open'),
        deskLoaded: DeskRuntime.loaded,
        deskRetired: true,
        realtimeStatus: RealtimeRuntime.status,
        build: 'patch3e-overall-stability-balance',
        deskSignature: DeskRuntime.lastSignature
      }),
      isInternalRoute,
      featureForRoute: internalFeatureForRoute
    });

    function internalStatusKey() {
      if (InternalState.authStatus === 'checking') return 'internal.status.checking';
      if (InternalState.authStatus === 'signed_in') return 'internal.status.signedIn';
      if (InternalState.authStatus === 'link_sent') return 'internal.status.linkSent';
      if (InternalState.authStatus === 'config_error') return 'internal.status.configError';
      if (InternalState.authStatus === 'auth_error') return 'internal.status.authError';
      if (InternalState.authStatus === 'inactive') return 'internal.status.inactive';
      return 'internal.status.signedOut';
    }

    function updateInternalAccessUI() {
      const statusKey = internalStatusKey();
      const statusText = translations[currentLang]?.[statusKey] || '';

      internalStatusElements.forEach(element => {
        element.textContent = statusText;
      });

      internalAuthFeedbacks.forEach(element => {
        element.textContent = ['link_sent', 'auth_error', 'config_error', 'inactive'].includes(InternalState.authStatus)
          ? statusText
          : '';
      });

      internalAuthSubmitButtons.forEach(button => {
        button.disabled = InternalState.authStatus === 'checking' || InternalState.authStatus === 'signed_in';
      });

      if (internalSessionUser) {
        const label = translations[currentLang]?.['internal.signedInAs'] || 'Signed in as';
        const name = InternalState.user?.displayName || '';
        internalSessionUser.textContent = name ? `${label} ${name}` : '';
      }

      internalSessionLine?.setAttribute('aria-hidden', String(!isInternalUserSignedIn()));
      updateDeskComposerState();
      updateInternalGateVisibility();

      if (!isInternalUserSignedIn() && InternalState.authStatus !== 'checking') {
        const gate = document.getElementById('globalAuthGate');
        const emailInput = gate?.querySelector('[data-internal-email]');
        if (emailInput && document.activeElement === document.body) {
          setTimeout(() => emailInput.focus(), 80);
        }
      }
    }

    async function requestInternalPasswordAccess(event) {
      event?.preventDefault?.();

      const form = event?.currentTarget;
      const emailInput = form?.querySelector('[data-internal-email]') || internalAuthEmailInputs[0];
      const passwordInput = form?.querySelector('[data-internal-password]') || internalAuthPasswordInputs[0];
      const email = emailInput?.value.trim();
      const password = passwordInput?.value || '';

      if (!email || !password) {
        setInternalAuthStatus('auth_error');
        updateInternalAccessUI();
        return;
      }

      rememberPendingInternalRoute(currentRoute || routeFromHash());
      setInternalAuthStatus('checking');
      updateInternalAccessUI();

      const result = await InternalData.auth.signInWithPassword(email, password);

      if (result.ok && getInternalMode() === 'supabase') {
        setInternalUser(result.user, result.session);
        if (InternalState.authStatus === 'signed_in') {
          unlockInternalAreas();
          restorePendingInternalRoute();
          applyInternalRouteProtection(currentRoute || routeFromHash());
        }
      } else if (result.ok) {
        await mockSignInInternalUser();
        applyInternalRouteProtection(currentRoute);
      } else {
        setInternalAuthStatus(result.error === 'client_unavailable' ? 'config_error' : 'auth_error');
      }

      updateInternalAccessUI();
    }

    function requestMockInternalAccess() {
      requestInternalPasswordAccess();
    }

    async function requestInternalSignOut() {
      await InternalData.auth.signOut();
      clearInternalUser();
      lockInternalAreas();
      applyInternalRouteProtection(currentRoute);
      updateInternalAccessUI();
    }

    const INTERNAL_PENDING_ROUTE_KEY = 'moscatelli:pending-internal-route';

    function normaliseRoute(route) {
      const cleanRoute = String(route || '')
        .replace(/^#/, '')
        .trim()
        .toLowerCase();

      return VALID_ROUTES.has(cleanRoute) ? cleanRoute : ROUTES.HOME;
    }

    function hasSupabaseAuthParams(value = '') {
      const raw = String(value || '').replace(/^#/, '').replace(/^\?/, '');
      if (!raw) return false;

      const params = new URLSearchParams(raw);
      return (
        params.has('access_token') ||
        params.has('refresh_token') ||
        params.has('error') ||
        params.has('error_code') ||
        params.has('code')
      );
    }

    function hasSupabaseAuthCallbackUrl() {
      return hasSupabaseAuthParams(window.location.hash) || hasSupabaseAuthParams(window.location.search);
    }

    function rememberPendingInternalRoute(route) {
      const safeRoute = normaliseRoute(route);
      if (!isInternalRoute(safeRoute)) return;

      try {
        localStorage.setItem(INTERNAL_PENDING_ROUTE_KEY, safeRoute);
      } catch {
        // Private browsing or storage restrictions should not block authentication.
      }
    }

    function consumePendingInternalRoute() {
      try {
        const storedRoute = normaliseRoute(localStorage.getItem(INTERNAL_PENDING_ROUTE_KEY));
        localStorage.removeItem(INTERNAL_PENDING_ROUTE_KEY);
        return isInternalRoute(storedRoute) ? storedRoute : null;
      } catch {
        return null;
      }
    }

    function restorePendingInternalRoute() {
      const pendingRoute = consumePendingInternalRoute();
      if (!pendingRoute) return false;

      history.replaceState({ route: pendingRoute }, '', `#${pendingRoute}`);
      applyRoute(pendingRoute);
      return true;
    }

    function clearSupabaseAuthCallbackUrl(route = currentRoute || ROUTES.HOME) {
      if (!hasSupabaseAuthCallbackUrl()) return;

      const safeRoute = normaliseRoute(route);
      const routeHash = safeRoute === ROUTES.HOME ? '' : `#${safeRoute}`;
      history.replaceState({ route: safeRoute }, '', `${window.location.origin}${window.location.pathname}${routeHash}`);
    }

    function routeFromHash() {
      if (hasSupabaseAuthParams(window.location.hash)) {
        return currentRoute || ROUTES.HOME;
      }

      const rawHash = window.location.hash.replace('#', '');

      try {
        return normaliseRoute(decodeURIComponent(rawHash));
      } catch {
        return ROUTES.HOME;
      }
    }

    function titleForRoute(route) {
      return ROUTE_TITLES[route] || ROUTE_TITLES[ROUTES.HOME];
    }

    function isDivisionChildRoute(route) {
      return DIVISION_CHILD_ROUTES.has(route);
    }

    function isDivisionsRoute(route) {
      return route === ROUTES.DIVISIONS || isDivisionChildRoute(route);
    }

    function applyRoute(route) {
      const nextRoute = normaliseRoute(route);
      if (nextRoute === currentRoute) return;

      if (nextRoute === ROUTES.GALLERY) preloadGalleryImages();

      currentRoute = nextRoute;
      document.body.dataset.route = nextRoute;
      document.title = titleForRoute(nextRoute);

      routeViews.forEach(view => {
        const isActive = view.dataset.view === nextRoute;
        view.classList.toggle('is-active', isActive);
        view.setAttribute('aria-hidden', String(!isActive));
      });
      if (nextRoute !== ROUTES.HOME && monogramGlowOverlay) monogramGlowOverlay.classList.remove('is-lit');

      routeLinks.forEach(link => {
        const linkRoute = link.dataset.route;
        const isCurrent =
          linkRoute === nextRoute ||
          (linkRoute === ROUTES.DIVISIONS && isDivisionChildRoute(nextRoute));

        if (isCurrent) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      divisionDoors.forEach(door => {
        const isCurrent = door.dataset.route === nextRoute;
        door.classList.toggle('is-selected', isCurrent);
        door.setAttribute('aria-pressed', String(isCurrent));
      });
      divisionDoorsWrap?.classList.toggle('has-selected', isDivisionChildRoute(nextRoute) );

      applyInternalRouteProtection(nextRoute);
    }

    async function navigateTo(route) {
      const nextRoute = normaliseRoute(route);
      const nextHash = `#${nextRoute}`;

      if (nextRoute === ROUTES.GALLERY) {
        await waitForGalleryImages(1500);
      }

      if (window.location.hash !== nextHash) {
        history.pushState({ route: nextRoute }, '', nextHash);
      }

      applyRoute(nextRoute);
      closeNav();
      releaseTapFocus();
    }

    // Establish the correct view before the entrance sequence begins.
    initInternalAccessLayer();
    updateInternalAccessUI();
    const initialRoute = routeFromHash();
    applyRoute(initialRoute);
    if (initialRoute === ROUTES.GALLERY) {
      preloadGalleryImages();
    } else {
      scheduleGalleryWarmup(3400);
    }

    routeLinks.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        navigateTo(link.dataset.route);
      });

      if (link.dataset.route === 'gallery') {
        link.addEventListener('pointerenter', preloadGalleryImages, { passive: true });
        link.addEventListener('focus', preloadGalleryImages);
        link.addEventListener('touchstart', preloadGalleryImages, { passive: true });
      }
    });

    // Placeholder links must not alter the active route or URL.
    sideNav.querySelectorAll('a[href="#"]:not([data-route])').forEach(link => {
      link.addEventListener('click', event => event.preventDefault());
    });

    // ── Desktop monogram pointer glow ──
    // A restrained radial highlight follows the pointer, but the light is painted
    // only inside the monogram paths by the SVG gradient itself.
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    let glowFrame = null;
    let glowEvent = null;

    function updateMonogramGlowFromPointer(event) {
      if (
        currentRoute !== ROUTES.HOME ||
        document.body.classList.contains('desk-open') ||
        !pageHint ||
        !monogramGlowOverlay ||
        !heroPointerGlow ||
        !finePointerQuery.matches
      ) {
        monogramGlowOverlay?.classList.remove('is-lit');
        return;
      }
      const rect = pageHint.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = ((event.clientX - rect.left) / rect.width) * 1500;
      const y = ((event.clientY - rect.top) / rect.height) * 1500;

      heroPointerGlow.setAttribute('cx', x.toFixed(2));
      heroPointerGlow.setAttribute('cy', y.toFixed(2));
      monogramGlowOverlay.classList.add('is-lit');
    }

    function requestMonogramGlowUpdate(event) {
      glowEvent = event;
      if (glowFrame) return;
      glowFrame = requestAnimationFrame(() => {
        glowFrame = null;
        if (glowEvent) updateMonogramGlowFromPointer(glowEvent);
      });
    }

    if (routeHome && pageHint && monogramGlowOverlay && heroPointerGlow) {
      routeHome.addEventListener('pointermove', requestMonogramGlowUpdate);
      routeHome.addEventListener('pointerleave', () => monogramGlowOverlay.classList.remove('is-lit'));
      finePointerQuery.addEventListener?.('change', event => {
        if (!event.matches && monogramGlowOverlay) monogramGlowOverlay.classList.remove('is-lit');
      });
    }

    window.addEventListener('popstate', () => {
      closeRecordAttachmentViewer({ restoreFocus: false });
      applyRoute(routeFromHash());
    });
    window.addEventListener('hashchange', () => {
      if (hasSupabaseAuthCallbackUrl()) {
        initInternalAccessLayer();
        return;
      }

      closeRecordAttachmentViewer({ restoreFocus: false });
      applyRoute(routeFromHash());
    });

    // ── Desktop slit-gallery interaction ──
    function getGalleryGap() {
      if (!galleryAccordion) return 0;
      const styles = window.getComputedStyle(galleryAccordion);
      return parseFloat(styles.columnGap || styles.gap) || 0;
    }

    function getClosedSlitWidth() {
      if (!galleryDesktopQuery.matches) return 0;
      const vw = window.innerWidth * 0.048;
      return Math.min(92, Math.max(64, vw));
    }

    function updateGalleryPanelWidths() {
      if (!galleryAccordion || !galleryPanels.length) return;

      const galleryRect = galleryAccordion.getBoundingClientRect();
      const galleryWidth = galleryRect.width;
      const galleryHeight = galleryRect.height;
      const gap = getGalleryGap();
      const closedSlitWidth = getClosedSlitWidth();
      const closedNeighbours = Math.max(0, galleryPanels.length - 1);
      const reservedWidth = (closedSlitWidth * closedNeighbours) + (gap * closedNeighbours);
      const availableWidth = Math.max(220, galleryWidth - reservedWidth);

      galleryPanels.forEach(panel => {
        const ratio = parseFloat(panel.dataset.ratio || '1') || 1;
        const naturalAspectWidth = galleryHeight * ratio;
        const activeWidth = Math.min(naturalAspectWidth, availableWidth);
        const imageWidth = Math.max(180, activeWidth);
        const imageHeight = Math.min(galleryHeight, imageWidth / ratio);

        panel.style.setProperty('--active-w', `${imageWidth.toFixed(2)}px`);
        panel.style.setProperty('--image-w', `${imageWidth.toFixed(2)}px`);
        panel.style.setProperty('--image-h', `${Math.max(180, imageHeight).toFixed(2)}px`);
      });
    }

    function setActiveGalleryPanel(panel) {
      updateGalleryPanelWidths();
      const shouldClose = panel.classList.contains('is-active');

      if (galleryCaptionTimer) {
        clearTimeout(galleryCaptionTimer);
        galleryCaptionTimer = null;
      }

      galleryPanels.forEach(item => {
        const isActive = !shouldClose && item === panel;
        item.classList.toggle('is-active', isActive);
        item.classList.remove('is-caption-visible');
        item.setAttribute('aria-expanded', String(isActive));
      });

      if (galleryAccordion) {
        galleryAccordion.classList.toggle('has-active', !shouldClose);
      }

      if (!shouldClose) {
        galleryCaptionTimer = setTimeout(() => {
          if (panel.classList.contains('is-active')) {
            panel.classList.add('is-caption-visible');
          }
        }, 980);
      }
    }

    galleryPanels.forEach(panel => {
      panel.addEventListener('click', () => setActiveGalleryPanel(panel));
    });

    updateGalleryPanelWidths();
    window.addEventListener('resize', updateGalleryPanelWidths);
    galleryDesktopQuery.addEventListener?.('change', event => {
      if (event.matches) scheduleGalleryWarmup();
    });
    if ('ResizeObserver' in window && galleryAccordion) {
      new ResizeObserver(updateGalleryPanelWidths).observe(galleryAccordion);
    }

    // ── Cinematic entrance sequence ──
    // 1. Background blooms in
    setTimeout(() => bgScene.classList.add('visible'), 80);
    // 2. Header descends
    setTimeout(() => header.classList.add('visible'), 1100);
    // 3. Logo materialises
    setTimeout(() => logoMark.classList.add('visible'), 1850);
    // 4. Footer rises
    setTimeout(() => footer.classList.add('visible'), 2350);
    // 5. Background logo fades
    if (pageHint) setTimeout(() => pageHint.classList.add('visible'), 3000);

    // ── Language toggles ──
    function updateMenuAria() {
      const menuKey = sideNav.classList.contains('open') ? 'aria.closeMenu' : 'aria.openMenu';
      hamburger.setAttribute('aria-label', translations[currentLang][menuKey]);
      languageToggles.forEach(toggle => {
        toggle.setAttribute('aria-label', translations[currentLang]['aria.language']);
      });
    }

    function updateLangControls(lang) {
      langButtons.forEach(button => {
        const isActive = button.dataset.lang === lang;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    }

    function setLanguage(lang) {
      if (!translations[lang] || lang === currentLang) return;

      currentLang = lang;
      const langCode = lang === 'pt' ? 'pt-BR' : 'en';
      // Keep language metadata local to the areas that actually change.
      // Updating <html lang> causes a full-page restyle in some mobile WebViews,
      // which is the source of the black blink on the EN / PT control.
      sideNav.setAttribute('lang', langCode);
      footer.setAttribute('lang', langCode);

      // Swap only the text nodes. No global fade: this avoids the black blink
      // on mobile browsers when many composited elements repaint at once.
      i18nElements.forEach(element => {
        const key = element.dataset.i18n;
        if (translations[lang][key]) element.textContent = translations[lang][key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        if (translations[lang][key]) element.setAttribute('placeholder', translations[lang][key]);
      });

      updateLangControls(lang);
      document.querySelectorAll('[data-delete-owned-entry]').forEach(button => {
        button.textContent = translations[lang]?.['dashboard.delete'] || button.textContent;
      });
      updateInternalAccessUI();
      updateMenuAria();
    }

    function detectDefaultLanguage() {
      try {
        const storedLanguage = localStorage.getItem('moscatelli:language');
        if (translations[storedLanguage]) return storedLanguage;
      } catch {
        // Local storage should never block the page.
      }

      const browserLanguage = navigator.language || '';
      return browserLanguage.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    }

    const initialLanguage = detectDefaultLanguage();
    if (initialLanguage !== currentLang) {
      setLanguage(initialLanguage);
    } else {
      updateLangControls(currentLang);
      updateMenuAria();
    }

    internalAuthForms.forEach(form => {
      form.addEventListener('submit', requestInternalPasswordAccess);
    });

    internalMockSignInButtons.forEach(button => {
      button.addEventListener('click', requestMockInternalAccess);
    });

    internalSignOut?.addEventListener('click', requestInternalSignOut);

    window.addEventListener('moscatelli:internal-auth-status', updateInternalAccessUI);
    window.addEventListener('moscatelli:internal-user', updateInternalAccessUI);
    window.addEventListener('moscatelli:internal-sign-out', updateInternalAccessUI);

    langButtons.forEach(button => {
      button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        setLanguage(button.dataset.lang);
        try { localStorage.setItem('moscatelli:language', currentLang); } catch {}
        releaseTapFocus();
      });
      button.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        setLanguage(button.dataset.lang);
        try { localStorage.setItem('moscatelli:language', currentLang); } catch {}
        releaseTapFocus();
      });
    });

    // ── Menu toggle ──
    function releaseTapFocus() {
      requestAnimationFrame(() => {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
      });
    }

    function openNav() {
      clearTimeout(navStaggerTimer);
      document.body.classList.add('is-nav-open');
      sideNav.classList.add('open', 'entrance-stagger');
      sideNav.setAttribute('aria-hidden', 'false');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      overlay.classList.add('open');
      updateMenuAria();

      navStaggerTimer = setTimeout(() => {
        sideNav.classList.remove('entrance-stagger');
      }, 920);
    }
    function closeNav() {
      clearTimeout(navStaggerTimer);
      document.body.classList.remove('is-nav-open');
      sideNav.classList.remove('entrance-stagger', 'open');
      sideNav.setAttribute('aria-hidden', 'true');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('open');
      updateMenuAria();
    }

    updateMenuAria();

    hamburger.addEventListener('click', e => {
      e.preventDefault();
      sideNav.classList.contains('open') ? closeNav() : openNav();
      releaseTapFocus();
    });
    overlay.addEventListener('click', e => {
      e.preventDefault();
      closeNav();
      releaseTapFocus();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeNav();
        closeDesk();
        dashboardFilter?.classList.remove('is-open');
        dashboardFilterTrigger?.setAttribute('aria-expanded', 'false');
        closeEntryCategory();
      }
    });

    // ── Divisions selector ──
    // Each glass door now opens its own blank internal route within the same HTML.
    divisionDoors.forEach(door => {
      door.addEventListener('click', () => {
        const targetRoute = door.dataset.route;
        if (!targetRoute) return;

        divisionDoors.forEach(item => {
          item.classList.toggle('is-selected', item === door);
          item.setAttribute('aria-pressed', String(item === door));
        });
        divisionDoorsWrap?.classList.add('has-selected');

        navigateTo(targetRoute);
      });
    });

    divisionReturn?.addEventListener('click', () => {
      navigateTo(ROUTES.DIVISIONS);
      releaseTapFocus();
    });

    function deskMessageFromComposer() {
      return {
        channel: DESK_DATA_CONFIG.channel,
        body: deskMessageInput?.value.trim() || ''
      };
    }

    function deskMessageTimeLabel(dateValue) {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return '';

      return date.toLocaleTimeString(currentLang === 'pt' ? 'pt-BR' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function updateDeskComposerState() {
      const permissions = InternalData.messages.permissions();
      const canSend = Boolean(permissions.can_send);

      if (deskMessageInput) deskMessageInput.disabled = !canSend;
      if (deskSendMessage) deskSendMessage.disabled = !canSend;
      if (deskComposerMeta) {
        const key = canSend ? 'desk.ready' : 'desk.locked';
        deskComposerMeta.textContent = translations[currentLang]?.[key] || '';
      }

      deskPanel?.setAttribute('data-desk-state', canSend ? 'ready' : 'locked');
      deskPanel?.setAttribute('data-provider', getInternalMode());
    }

    function deletedDeskMessageText(message) {
      const displayName = message.deleted_by_display || message.sender_display || 'User';
      const template = translations[currentLang]?.['desk.deletedMessage'] || '{user} deleted a message';
      return template.replace('{user}', displayName);
    }

    function renderDeskMessageRecord(message) {
      if (!deskThread || !message || deskThread.querySelector(`[data-message-id="${message.id}"]`)) return null;

      deskEmpty?.remove();

      const currentUser = getCurrentInternalUser();
      const isSent = message.created_by && currentUser?.id === message.created_by;
      const isDeleted = Boolean(message.deleted_at);
      const permissions = InternalData.messages.permissions(message);

      const item = document.createElement('article');
      item.className = `desk-message ${isSent ? 'is-sent' : 'is-received'}${isDeleted ? ' is-deleted' : ''}`;
      item.dataset.messageId = message.id;
      item.dataset.createdBy = message.created_by || '';
      item.dataset.channel = message.channel || DESK_DATA_CONFIG.channel;
      item.dataset.messageSource = message.source || getInternalMode();
      item.dataset.deleted = String(isDeleted);

      const name = document.createElement('span');
      name.className = 'desk-message-name';
      name.textContent = message.sender_display || 'Member';

      const body = document.createElement('p');
      body.className = 'desk-message-body';
      body.textContent = isDeleted ? deletedDeskMessageText(message) : (message.body || '');

      const time = document.createElement('span');
      time.className = 'desk-message-time';
      time.textContent = deskMessageTimeLabel(message.created_at);

      item.append(name, body, time);

      if (permissions.can_delete) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'desk-message-delete';
        deleteButton.type = 'button';
        deleteButton.dataset.deleteDeskMessage = 'true';
        deleteButton.textContent = translations[currentLang]?.['desk.delete'] || 'Delete';
        item.appendChild(deleteButton);
      }

      deskThread.appendChild(item);

      const wrap = deskThread.closest('[data-desk-thread-wrap]');
      if (wrap) wrap.scrollTop = wrap.scrollHeight;

      return item;
    }

    function deskMessagesSignature(messages = []) {
      return messages
        .map(message => [
          message.id,
          message.created_by || '',
          message.body || '',
          message.deleted_at || '',
          message.deleted_by_display || '',
          message.updated_at || message.created_at || ''
        ].join('|'))
        .join('||');
    }

    async function loadDeskMessages({ force = false, reason = 'manual' } = {}) {
      if (!deskThread || !isInternalUserSignedIn()) return [];
      if (DeskRuntime.loaded && !force) return [];

      try {
        const messages = await InternalData.messages.list({ channel: DESK_DATA_CONFIG.channel });
        const signature = deskMessagesSignature(messages);
        const changed = signature !== DeskRuntime.lastSignature;

        if (force && changed) {
          deskThread.querySelectorAll('.desk-message').forEach(message => message.remove());
          if (deskEmpty && !deskThread.contains(deskEmpty)) deskThread.appendChild(deskEmpty);
        }

        if (!DeskRuntime.loaded || changed) {
          messages.forEach(message => renderDeskMessageRecord(message));

          if (messages.length) {
            deskEmpty?.remove();
          } else if (deskEmpty && !deskThread.contains(deskEmpty)) {
            deskThread.appendChild(deskEmpty);
          }
        }

        DeskRuntime.loaded = true;
        DeskRuntime.lastSignature = signature;

        window.dispatchEvent(new CustomEvent('moscatelli:desk-loaded', {
          detail: {
            count: messages.length,
            channel: DESK_DATA_CONFIG.channel,
            force,
            reason,
            changed
          }
        }));

        return messages;
      } catch (error) {
        DeskRuntime.loaded = false;
        window.dispatchEvent(new CustomEvent('moscatelli:desk-load-error', { detail: { error, reason } }));
        return [];
      }
    }

    function dispatchRealtimeEvent(type, detail = {}) {
      window.dispatchEvent(new CustomEvent(`moscatelli:realtime-${type}`, {
        detail: {
          mode: getInternalMode(),
          signedIn: isInternalUserSignedIn(),
          user: getCurrentInternalUser(),
          ...detail
        }
      }));
    }

    function releaseRealtimeChannel(key, label = key) {
      const channel = RealtimeRuntime[key];
      if (!channel) return;

      const client = createInternalSupabaseClient();
      if (client?.removeChannel) {
        Promise.resolve(client.removeChannel(channel)).catch(error => {
          dispatchRealtimeEvent('release-error', { label, error });
        });
      }

      RealtimeRuntime[key] = null;
      dispatchRealtimeEvent('released', { label });
    }

    function releaseDeskRealtime() {
      releaseRealtimeChannel('deskChannel', 'desk');
      if (RealtimeRuntime.deskRefreshTimer) {
        clearTimeout(RealtimeRuntime.deskRefreshTimer);
        RealtimeRuntime.deskRefreshTimer = null;
      }
      DeskRuntime.subscribed = false;
    }

    function releaseDashboardRealtime() {
      releaseRealtimeChannel('dashboardChannel', 'record');
      releaseRealtimeChannel('attachmentChannel', 'record-attachments');
      if (RealtimeRuntime.dashboardRefreshTimer) {
        clearTimeout(RealtimeRuntime.dashboardRefreshTimer);
        RealtimeRuntime.dashboardRefreshTimer = null;
      }
    }

    function releaseAllRealtime() {
      releaseDeskRealtime();
      releaseDashboardRealtime();
      RealtimeRuntime.status = 'idle';
    }

    function removeDeskMessageById(messageId) {
      if (!messageId || !deskThread) return false;
      const item = deskThread.querySelector(`[data-message-id="${messageId}"]`);
      if (!item) return false;
      item.remove();
      if (deskEmpty && !deskThread.querySelector('.desk-message') && !deskThread.contains(deskEmpty)) deskThread.appendChild(deskEmpty);
      return true;
    }

    function updateDeskMessageFromRealtime(message) {
      if (!message?.id || !deskThread) return;
      removeDeskMessageById(message.id);
      renderDeskMessageRecord(message);
    }

    function scheduleDeskRealtimeReload(reason = 'desk-change') {
      if (!isInternalUserSignedIn()) return;

      if (RealtimeRuntime.deskRefreshTimer) {
        clearTimeout(RealtimeRuntime.deskRefreshTimer);
      }

      RealtimeRuntime.deskRefreshTimer = setTimeout(() => {
        RealtimeRuntime.deskRefreshTimer = null;

        if (!document.body.classList.contains('desk-open')) {
          DeskRuntime.loaded = false;
          return;
        }

        DeskRuntime.loaded = false;
        loadDeskMessages({ force: true, reason });
        dispatchRealtimeEvent('desk-refresh', { reason });
      }, 220);
    }

    function prepareDeskRealtimeHooks() {
      return;
      if (DeskRuntime.subscribed || RealtimeRuntime.deskChannel) return;

      if (!DESK_DATA_CONFIG.realtimeEnabled || getInternalMode() !== 'supabase' || !isInternalUserSignedIn()) {
        dispatchRealtimeEvent('desk-skipped', {
          enabled: DESK_DATA_CONFIG.realtimeEnabled,
          channel: DESK_DATA_CONFIG.channel,
          table: DESK_DATA_CONFIG.table
        });
        return;
      }

      const client = createInternalSupabaseClient();
      if (!client?.channel) {
        dispatchRealtimeEvent('desk-unavailable', { table: DESK_DATA_CONFIG.table });
        return;
      }

      const channel = client
        .channel(`moscatelli-desk-${DESK_DATA_CONFIG.channel}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: DESK_DATA_CONFIG.table,
          filter: `channel=eq.${DESK_DATA_CONFIG.channel}`
        }, payload => {
          const message = InternalData.messages.fromRealtime(payload.new);
          scheduleDeskRealtimeReload('desk-insert');
          dispatchRealtimeEvent('desk-insert', { messageId: message?.id || payload.new?.id || null });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: DESK_DATA_CONFIG.table,
          filter: `channel=eq.${DESK_DATA_CONFIG.channel}`
        }, payload => {
          const message = InternalData.messages.fromRealtime(payload.new);
          scheduleDeskRealtimeReload('desk-update');
          dispatchRealtimeEvent('desk-update', { messageId: message?.id || payload.new?.id || null });
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: DESK_DATA_CONFIG.table,
          filter: `channel=eq.${DESK_DATA_CONFIG.channel}`
        }, payload => {
          const messageId = payload.old?.id || null;
          scheduleDeskRealtimeReload('desk-delete');
          dispatchRealtimeEvent('desk-delete', { messageId });
        })
        .subscribe(status => {
          RealtimeRuntime.status = status;
          dispatchRealtimeEvent('desk-status', { status, channel: DESK_DATA_CONFIG.channel, table: DESK_DATA_CONFIG.table });
        });

      RealtimeRuntime.deskChannel = channel;
      DeskRuntime.subscribed = true;
      window.dispatchEvent(new CustomEvent('moscatelli:desk-realtime-ready', {
        detail: {
          enabled: DESK_DATA_CONFIG.realtimeEnabled,
          channel: DESK_DATA_CONFIG.channel,
          table: DESK_DATA_CONFIG.table,
          event: DESK_DATA_CONFIG.realtimeEvent
        }
      }));
    }

    async function sendDeskMessage() {
      const payload = deskMessageFromComposer();
      if (!payload.body) return null;

      try {
        const result = await InternalData.messages.send(payload);
        if (!result.ok) return null;

        renderDeskMessageRecord(result.message);
        if (deskMessageInput) deskMessageInput.value = '';
        scheduleDeskRealtimeReload('desk-send');

        return result.message;
      } catch (error) {
        window.dispatchEvent(new CustomEvent('moscatelli:desk-send-error', { detail: { error } }));
        return null;
      }
    }

    function setDeskOpenState(isOpen) {
      document.body.classList.toggle('desk-open', isOpen);
      deskPanel?.setAttribute('aria-hidden', String(!isOpen));
      deskScrim?.setAttribute('aria-hidden', String(!isOpen));
      deskTrigger?.setAttribute('aria-expanded', String(isOpen));

      window.dispatchEvent(new CustomEvent(isOpen ? 'moscatelli:desk-open' : 'moscatelli:desk-close', {
        detail: DESK_CONFIG
      }));
    }

    function stopDeskAuthoritativeSync() {
      if (DeskRuntime.syncTimer) {
        clearInterval(DeskRuntime.syncTimer);
        DeskRuntime.syncTimer = null;
      }
    }

    function syncDeskFromSource(reason = 'desk-sync') {
      if (!isInternalUserSignedIn() || !document.body.classList.contains('desk-open')) return;
      DeskRuntime.loaded = false;
      loadDeskMessages({ force: true, reason });
    }

    function startDeskAuthoritativeSync() {
      if (!isInternalUserSignedIn() || DeskRuntime.syncTimer) return;

      DeskRuntime.syncTimer = setInterval(() => {
        syncDeskFromSource('desk-poll');
      }, 2600);
    }

    function openDesk() {
      // Patch 14: The Desk has been retired from the website. Team correspondence now belongs in external tools.
      closeDesk();
      return;
    }

    function closeDesk() {
      setDeskOpenState(false);
      stopDeskAuthoritativeSync();
      releaseTapFocus();
    }

    function toggleDesk() {
      document.body.classList.contains('desk-open') ? closeDesk() : openDesk();
    }

    deskComposer?.addEventListener('submit', event => {
      event.preventDefault();
      sendDeskMessage();
    });

    deskMessageInput?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey || event.isComposing) return;

      event.preventDefault();
      sendDeskMessage();
    });

    deskThread?.addEventListener('click', async event => {
      const deleteButton = event.target.closest('[data-delete-desk-message]');
      if (!deleteButton) return;

      const item = deleteButton.closest('[data-message-id]');
      const messageId = item?.dataset.messageId;
      if (!messageId) return;

      deleteButton.disabled = true;
      const result = await InternalData.messages.remove(messageId);

      if (result.ok && result.message) {
        updateDeskMessageFromRealtime(result.message);
      } else {
        deleteButton.disabled = false;
      }
    });

    deskTrigger?.addEventListener('click', toggleDesk);
    deskClose?.addEventListener('click', closeDesk);
    deskScrim?.addEventListener('click', closeDesk);

    const dashboardFilter = document.getElementById('dashboardFilter');
    const dashboardFilterTrigger = document.getElementById('dashboardFilterTrigger');
    const dashboardFilterMenu = document.getElementById('dashboardFilterMenu');
    const dashboardFilterValue = document.getElementById('dashboardFilterValue');
    const dashboardFeed = document.getElementById('dashboardFeed');
    const dashboardAttachmentInput = document.getElementById('dashboardAttachmentInput');
    const dashboardAttachments = document.getElementById('dashboardAttachments');
    const dashboardAttachmentLimit = document.getElementById('dashboardAttachmentLimit');
    const dashboardComposerFeedback = document.getElementById('dashboardComposerFeedback');
    const dashboardEntryCategory = document.getElementById('dashboardEntryCategory');
    const dashboardEntryCategoryTrigger = document.getElementById('dashboardEntryCategoryTrigger');
    const dashboardEntryCategoryMenu = document.getElementById('dashboardEntryCategoryMenu');
    const dashboardEntryCategoryValue = document.getElementById('dashboardEntryCategoryValue');
    const dashboardCommitEntry = document.getElementById('dashboardCommitEntry');
    const dashboardEntryTitle = document.getElementById('dashboardEntryTitle');
    const dashboardEntryBody = document.getElementById('dashboardEntryBody');
    const dashboardEntryComposer = document.getElementById('dashboardEntryComposer');
    const dashboardEntryToggle = document.getElementById('dashboardEntryToggle');
    const dashboardEntryClose = document.getElementById('dashboardEntryClose');
    const recordAttachmentViewer = document.getElementById('recordAttachmentViewer');
    const recordAttachmentViewerImage = document.getElementById('recordAttachmentViewerImage');
    const recordAttachmentViewerCaption = document.getElementById('recordAttachmentViewerCaption');
    const recordAttachmentViewerMeta = document.getElementById('recordAttachmentViewerMeta');
    const recordAttachmentViewerClose = document.getElementById('recordAttachmentViewerClose');
    const recordAttachmentViewerPrev = document.getElementById('recordAttachmentViewerPrev');
    const recordAttachmentViewerNext = document.getElementById('recordAttachmentViewerNext');
    let dashboardLocalAttachments = [];
    let dashboardCommitInFlight = false;
    let recordAttachmentViewerItems = [];
    let recordAttachmentViewerIndex = 0;
    let recordAttachmentViewerLastFocus = null;

    let dashboardCurrentFilter = 'all';
    const DashboardRuntime = { loaded: false, loading: false };

    function updateDashboardEmptyState() {
      const empty = document.getElementById('dashboardEmpty');
      if (!empty || !dashboardFeed) return;

      const visiblePosts = Array.from(dashboardFeed.querySelectorAll('.dashboard-post'))
        .filter(post => !post.classList.contains('is-hidden'));

      empty.classList.toggle('is-visible', visiblePosts.length === 0);
    }

    function clearDashboardPosts({ resetLoaded = true } = {}) {
      if (!dashboardFeed) return;

      dashboardFeed.querySelectorAll('.dashboard-post').forEach(post => post.remove());
      if (resetLoaded) DashboardRuntime.loaded = false;
      updateDashboardEmptyState();
    }

    function setDashboardFilter(category) {
      const nextCategory = category || 'all';
      dashboardCurrentFilter = nextCategory;

      dashboardFilterMenu?.querySelectorAll('[data-filter]').forEach(option => {
        const isActive = option.dataset.filter === nextCategory;
        option.classList.toggle('is-active', isActive);
        option.setAttribute('aria-selected', String(isActive));
        if (isActive && dashboardFilterValue) dashboardFilterValue.textContent = option.textContent;
      });

      dashboardFeed?.querySelectorAll('.dashboard-post').forEach(post => {
        const visible = nextCategory === 'all' || post.dataset.category === nextCategory;
        post.classList.toggle('is-hidden', !visible);
      });

      updateDashboardEmptyState();
      dashboardFilterTrigger?.classList.toggle('is-filtered', nextCategory !== 'all');
      dashboardFilter?.classList.remove('is-open');
      dashboardFilterTrigger?.setAttribute('aria-expanded', 'false');
    }

    function setEntryCategory(category) {
      if (!dashboardEntryCategory || !dashboardEntryCategoryMenu || !dashboardEntryCategoryValue) return;

      const options = dashboardEntryCategoryMenu.querySelectorAll('[data-category]');
      let activeText = '';

      options.forEach(option => {
        const isActive = option.dataset.category === category;
        option.classList.toggle('is-active', isActive);
        if (isActive) activeText = option.textContent;
      });

      dashboardEntryCategory.dataset.entryCategory = category;
      dashboardEntryCategoryValue.textContent = activeText || category;
      dashboardEntryCategory.classList.remove('is-open');
      dashboardEntryCategoryTrigger?.setAttribute('aria-expanded', 'false');
    }

    function toggleEntryCategory() {
      const isOpen = dashboardEntryCategory?.classList.toggle('is-open');
      dashboardEntryCategoryTrigger?.setAttribute('aria-expanded', String(Boolean(isOpen)));
      dashboardFilter?.classList.remove('is-open');
      dashboardFilterTrigger?.setAttribute('aria-expanded', 'false');
    }

    function closeEntryCategory() {
      dashboardEntryCategory?.classList.remove('is-open');
      dashboardEntryCategoryTrigger?.setAttribute('aria-expanded', 'false');
    }

    dashboardEntryCategoryTrigger?.addEventListener('click', toggleEntryCategory);

    dashboardEntryCategoryMenu?.addEventListener('click', event => {
      const option = event.target.closest('[data-category]');
      if (!option) return;
      setEntryCategory(option.dataset.category);
    });

    dashboardEntryCategoryMenu?.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      closeEntryCategory();
      dashboardEntryCategoryTrigger?.focus();
    });

    function romaniseNumber(number) {
      const romans = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
      ];
      let value = number;
      let result = '';

      romans.forEach(([amount, numeral]) => {
        while (value >= amount) {
          result += numeral;
          value -= amount;
        }
      });

      return result;
    }

    function normaliseLedgerDate(value) {
      const date = value instanceof Date ? value : new Date(value || Date.now());
      return Number.isNaN(date.getTime()) ? new Date() : date;
    }

    function ledgerDateIso(value) {
      return normaliseLedgerDate(value).toISOString().slice(0, 10);
    }

    function formatLedgerDate(value) {
      const date = normaliseLedgerDate(value);
      const months = {
        en: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
        pt: ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
      };

      const langMonths = months[currentLang] || months.en;
      return `${romaniseNumber(date.getDate())} ${langMonths[date.getMonth()]} ${romaniseNumber(date.getFullYear())}`;
    }

    function categoryLabelKey(category) {
      return `dashboard.cat.${category || 'meetings'}`;
    }

    function categoryLabel(category) {
      const key = categoryLabelKey(category);
      return translations[currentLang]?.[key] || category || '';
    }

    function sortDashboardPostsByDate() {
      if (!dashboardFeed) return;

      const posts = Array.from(dashboardFeed.querySelectorAll('.dashboard-post'));
      const empty = document.getElementById('dashboardEmpty');

      posts
        .sort((a, b) => String(b.dataset.createdAt || b.dataset.date || '').localeCompare(String(a.dataset.createdAt || a.dataset.date || '')))
        .forEach(post => dashboardFeed.insertBefore(post, empty || null));
    }

    function dashboardFeedbackText(key, fallback = '') {
      return translations[currentLang]?.[key] || fallback || '';
    }

    function setDashboardComposerFeedback(message = '', tone = '') {
      if (!dashboardComposerFeedback) return;

      dashboardComposerFeedback.textContent = message;
      dashboardComposerFeedback.classList.toggle('is-error', tone === 'error');
      dashboardComposerFeedback.classList.toggle('is-warning', tone === 'warning');
    }

    function resetDashboardComposer({ preserveAttachmentUrls = false, preserveFeedback = false } = {}) {
      if (dashboardEntryTitle) dashboardEntryTitle.value = '';
      if (dashboardEntryBody) dashboardEntryBody.value = '';
      if (dashboardAttachmentInput) dashboardAttachmentInput.value = '';

      if (!preserveAttachmentUrls) {
        dashboardLocalAttachments.forEach(item => URL.revokeObjectURL(item.url));
      }

      dashboardLocalAttachments = [];
      renderDashboardAttachments();
      if (!preserveFeedback) setDashboardComposerFeedback('');
    }

    function setDashboardComposerExpanded(expanded, { focus = false, reset = false } = {}) {
      if (!dashboardEntryComposer || !dashboardEntryToggle) return;

      const isExpanded = Boolean(expanded);
      dashboardEntryComposer.classList.toggle('is-expanded', isExpanded);
      dashboardEntryComposer.setAttribute('aria-hidden', String(!isExpanded));
      dashboardEntryToggle.classList.toggle('is-hidden', isExpanded);
      dashboardEntryToggle.setAttribute('aria-expanded', String(isExpanded));

      if (!isExpanded) {
        closeEntryCategory();
      }

      if (reset) {
        resetDashboardComposer();
        setCommitState('idle');
      }

      if (isExpanded) {
        setDashboardComposerFeedback('');
      }

      if (isExpanded && focus) {
        setTimeout(() => dashboardEntryTitle?.focus(), 180);
      }
    }

    function openDashboardComposer() {
      if (!isInternalUserSignedIn()) {
        setInternalAuthStatus('signed_out');
        updateInternalAccessUI();
        return;
      }

      setDashboardComposerExpanded(true, { focus: true });
    }

    function closeDashboardComposer({ reset = false } = {}) {
      setDashboardComposerExpanded(false, { reset });
      dashboardEntryToggle?.focus();
    }

    dashboardEntryToggle?.addEventListener('click', openDashboardComposer);
    dashboardEntryClose?.addEventListener('click', () => closeDashboardComposer({ reset: false }));

    dashboardEntryComposer?.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeDashboardComposer({ reset: false });
    });

    function setCommitState(state) {
      if (!dashboardCommitEntry) return;

      dashboardCommitEntry.classList.remove('is-pending', 'is-confirmed');
      dashboardCommitEntry.disabled = false;

      if (state === 'pending') {
        dashboardCommitEntry.disabled = true;
        dashboardCommitEntry.classList.add('is-pending');
        dashboardCommitEntry.textContent = translations[currentLang]?.['dashboard.recording'] || 'Recording…';
        return;
      }

      if (state === 'confirmed') {
        dashboardCommitEntry.disabled = true;
        dashboardCommitEntry.classList.add('is-confirmed');
        dashboardCommitEntry.textContent = translations[currentLang]?.['dashboard.recorded'] || 'Entry recorded';

        setTimeout(() => {
          dashboardCommitEntry.disabled = false;
          dashboardCommitEntry.classList.remove('is-confirmed');
          dashboardCommitEntry.textContent = translations[currentLang]?.['dashboard.commit'] || 'Commit Entry';
        }, 1400);
        return;
      }

      dashboardCommitEntry.textContent = translations[currentLang]?.['dashboard.commit'] || 'Commit Entry';
    }

    function dashboardRecordFromComposer() {
      const rawTitle = dashboardEntryTitle?.value.trim() || '';
      const rawBody = dashboardEntryBody?.value.trim() || '';

      return {
        channel: DASHBOARD_DATA_CONFIG.defaultChannel,
        category: dashboardEntryCategory?.dataset.entryCategory || DASHBOARD_DATA_CONFIG.defaultCategory,
        title: rawTitle || translations[currentLang]?.['dashboard.untitled'] || 'Untitled entry',
        body: rawBody || '—',
        rawTitle,
        rawBody,
        attachments: dashboardLocalAttachments.slice(0, DASHBOARD_DATA_CONFIG.maxAttachments)
      };
    }

    function validateDashboardRecord(payload) {
      if (payload?.rawTitle || payload?.rawBody) return true;

      setDashboardComposerFeedback(
        dashboardFeedbackText('dashboard.feedback.empty', 'Add a title or note before entering the Record.'),
        'error'
      );
      setCommitState('idle');
      dashboardEntryTitle?.focus();
      return false;
    }

    function dashboardRecordPermissions(record) {
      return InternalData.posts.permissions(record);
    }

    function hydrateDashboardPostElement(post, record) {
      const permissions = dashboardRecordPermissions(record);

      post.dataset.postId = record.id;
      post.dataset.category = record.category;
      post.dataset.date = ledgerDateIso(record.created_at);
      post.dataset.createdAt = normaliseLedgerDate(record.created_at).toISOString();
      post.dataset.owned = String(permissions.owned);
      post.dataset.canDelete = String(permissions.can_delete);
      post.dataset.createdBy = record.created_by || '';
      post.dataset.recordSource = record.source || getInternalMode();

      return permissions;
    }

    function attachmentDataFromElement(element) {
      if (!element) return null;

      return {
        id: element.dataset.attachmentId || '',
        path: element.dataset.attachmentPath || '',
        previewUrl: element.dataset.previewUrl || '',
        fileName: element.dataset.fileName || '',
        size: element.dataset.size || '',
        recordTitle: element.dataset.recordTitle || '',
        recordCategory: element.dataset.recordCategory || '',
        recordDate: element.dataset.recordDate || ''
      };
    }

    function setRecordAttachmentViewerNavigation() {
      const hasMany = recordAttachmentViewerItems.length > 1;
      if (recordAttachmentViewerPrev) recordAttachmentViewerPrev.hidden = !hasMany;
      if (recordAttachmentViewerNext) recordAttachmentViewerNext.hidden = !hasMany;
    }

    async function refreshDashboardAttachmentPreview(attachmentElement) {
      const path = attachmentElement?.dataset.attachmentPath;
      const img = attachmentElement?.querySelector('img');
      const currentUrl = attachmentElement?.dataset.previewUrl || img?.currentSrc || img?.src || '';
      if (!path || attachmentElement.dataset.refreshing === 'true' || (currentUrl && attachmentElement.dataset.failedPreviewUrl === currentUrl)) return '';

      attachmentElement.dataset.refreshing = 'true';
      attachmentElement.dataset.failedPreviewUrl = currentUrl;
      const signedUrl = await InternalData.attachments.refreshSignedUrl(path);
      attachmentElement.dataset.refreshing = 'false';

      if (!signedUrl) {
        attachmentElement.classList.add('is-unavailable');
        return '';
      }

      attachmentElement.dataset.previewUrl = signedUrl;
      attachmentElement.classList.remove('is-unavailable');
      if (img) img.src = signedUrl;

      return signedUrl;
    }

    async function refreshRecordAttachmentViewerItem(item) {
      if (!item?.path) return item?.previewUrl || '';

      const signedUrl = await InternalData.attachments.refreshSignedUrl(item.path);
      if (!signedUrl) return item.previewUrl || '';

      item.previewUrl = signedUrl;
      const matching = Array.from(dashboardFeed?.querySelectorAll('[data-attachment-path]') || [])
        .find(element => element.dataset.attachmentPath === item.path);
      if (matching) {
        matching.dataset.previewUrl = signedUrl;
        const img = matching.querySelector('img');
        if (img) img.src = signedUrl;
      }

      return signedUrl;
    }

    async function renderRecordAttachmentViewer(index) {
      if (!recordAttachmentViewer || !recordAttachmentViewerImage || !recordAttachmentViewerItems.length) return;

      const count = recordAttachmentViewerItems.length;
      recordAttachmentViewerIndex = ((index % count) + count) % count;
      const item = recordAttachmentViewerItems[recordAttachmentViewerIndex];
      const src = item.previewUrl || await refreshRecordAttachmentViewerItem(item);

      recordAttachmentViewerImage.removeAttribute('src');
      recordAttachmentViewerImage.alt = item.recordTitle || item.fileName || 'Record attachment';

      if (src) {
        recordAttachmentViewerImage.src = src;
      } else {
        recordAttachmentViewerImage.alt = translations[currentLang]?.['dashboard.viewerUnavailable'] || 'This plate could not be re-opened.';
      }

      if (recordAttachmentViewerCaption) {
        recordAttachmentViewerCaption.textContent = item.recordTitle || item.fileName || translations[currentLang]?.['dashboard.viewerTitle'] || 'Record Plate';
      }

      if (recordAttachmentViewerMeta) {
        const parts = [item.recordCategory, item.recordDate, item.size].filter(Boolean);
        recordAttachmentViewerMeta.textContent = parts.join(' · ');
      }

      setRecordAttachmentViewerNavigation();
    }

    async function openRecordAttachmentViewer(items = [], index = 0, trigger = null) {
      if (!recordAttachmentViewer || !recordAttachmentViewerImage || !items.length) return;

      recordAttachmentViewerItems = items;
      recordAttachmentViewerLastFocus = trigger || document.activeElement;
      recordAttachmentViewer.hidden = false;
      recordAttachmentViewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('record-lightbox-open');
      await renderRecordAttachmentViewer(index);
      recordAttachmentViewerClose?.focus({ preventScroll: true });
    }

    function closeRecordAttachmentViewer({ restoreFocus = true } = {}) {
      if (!recordAttachmentViewer || recordAttachmentViewer.hidden) return;

      recordAttachmentViewer.hidden = true;
      recordAttachmentViewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('record-lightbox-open');
      if (recordAttachmentViewerImage) recordAttachmentViewerImage.removeAttribute('src');
      recordAttachmentViewerItems = [];

      if (restoreFocus && recordAttachmentViewerLastFocus?.focus) {
        recordAttachmentViewerLastFocus.focus({ preventScroll: true });
      }

      recordAttachmentViewerLastFocus = null;
    }

    function moveRecordAttachmentViewer(direction = 1) {
      if (!recordAttachmentViewerItems.length) return;
      renderRecordAttachmentViewer(recordAttachmentViewerIndex + direction);
    }

    function renderDashboardPostRecord(record, { prepend = true } = {}) {
      if (!dashboardFeed || !record) return null;
      if (record.id && dashboardFeed.querySelector(`[data-post-id="${record.id}"]`)) return null;

      const createdAt = normaliseLedgerDate(record.created_at);
      const dateIso = ledgerDateIso(record.created_at);

      const post = document.createElement('article');
      post.className = record.source === 'mock' ? 'dashboard-post is-local' : 'dashboard-post';
      const permissions = hydrateDashboardPostElement(post, record);
      post.dataset.date = dateIso;
      post.dataset.createdAt = createdAt.toISOString();

      const dateEl = document.createElement('div');
      dateEl.className = 'dashboard-post-date';
      dateEl.textContent = formatLedgerDate(createdAt);

      const main = document.createElement('div');
      main.className = 'dashboard-post-main';

      const categoryEl = document.createElement('span');
      categoryEl.className = 'dashboard-post-category';
      categoryEl.textContent = categoryLabel(record.category);

      const titleEl = document.createElement('h2');
      titleEl.textContent = record.title;

      const bodyEl = document.createElement('p');
      bodyEl.textContent = record.body;

      const foot = document.createElement('div');
      foot.className = 'dashboard-post-foot';
      foot.textContent = record.source === 'supabase'
        ? (translations[currentLang]?.['dashboard.authorSupabase'] || 'Recorded in the Record')
        : (translations[currentLang]?.['dashboard.authorLocal'] || 'Local draft · Not saved');

      const actions = document.createElement('div');
      actions.className = 'dashboard-post-actions';

      const deleteButton = document.createElement('button');
      deleteButton.className = 'dashboard-delete-entry';
      deleteButton.type = 'button';
      deleteButton.dataset.deleteOwnedEntry = 'true';
      deleteButton.textContent = translations[currentLang]?.['dashboard.delete'] || 'Delete';
      deleteButton.hidden = !permissions.can_delete;

      actions.append(foot, deleteButton);
      main.append(categoryEl, titleEl, bodyEl);

      if (record.attachments?.length) {
        const preview = document.createElement('div');
        preview.className = 'dashboard-attachments dashboard-post-attachments';

        record.attachments.forEach((item, index) => {
          const attachment = document.createElement('button');
          attachment.className = 'dashboard-attachment dashboard-attachment-open';
          attachment.type = 'button';
          attachment.dataset.attachmentId = item.id || '';
          attachment.dataset.attachmentPath = item.path || '';
          attachment.dataset.previewUrl = item.preview_url || '';
          attachment.dataset.fileName = item.file_name || '';
          attachment.dataset.size = formatBytes(item.resized_size);
          attachment.dataset.recordTitle = record.title || '';
          attachment.dataset.recordCategory = categoryLabel(record.category);
          attachment.dataset.recordDate = formatLedgerDate(createdAt);
          attachment.setAttribute('aria-label', `${translations[currentLang]?.['dashboard.viewerTitle'] || 'Record Plate'} ${index + 1}`);

          if (item.preview_url) {
            const img = document.createElement('img');
            img.src = item.preview_url;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.addEventListener('error', () => refreshDashboardAttachmentPreview(attachment));
            attachment.appendChild(img);
          } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'dashboard-attachment-placeholder';
            placeholder.textContent = translations[currentLang]?.['dashboard.viewerTitle'] || 'Record Plate';
            attachment.appendChild(placeholder);
          }

          const label = document.createElement('span');
          label.textContent = formatBytes(item.resized_size);

          attachment.appendChild(label);
          preview.appendChild(attachment);
        });

        main.appendChild(preview);
      }

      main.appendChild(actions);
      post.append(dateEl, main);

      const empty = document.getElementById('dashboardEmpty');
      if (prepend) {
        dashboardFeed.insertBefore(post, empty || dashboardFeed.firstChild);
      } else {
        dashboardFeed.appendChild(post);
      }

      return post;
    }

    async function loadDashboardRecords(filters = {}) {
      clearDashboardPosts({ resetLoaded: false });
      const records = await InternalData.posts.list(filters);
      records.forEach(record => renderDashboardPostRecord(record, { prepend: false }));
      sortDashboardPostsByDate();
      setDashboardFilter(dashboardCurrentFilter);
      DashboardRuntime.loaded = true;
      return records;
    }

    async function ensureDashboardRecordsLoaded({ force = false } = {}) {
      if (!dashboardFeed || !isInternalUserSignedIn()) return [];
      if (DashboardRuntime.loading) return [];
      if (DashboardRuntime.loaded && !force) return [];

      DashboardRuntime.loading = true;
      try {
        return await loadDashboardRecords({ channel: DASHBOARD_DATA_CONFIG.defaultChannel });
      } catch (error) {
        window.dispatchEvent(new CustomEvent('moscatelli:record-load-error', { detail: { error } }));
        return [];
      } finally {
        DashboardRuntime.loading = false;
      }
    }

    function removeDashboardPostById(postId) {
      if (!postId || !dashboardFeed) return false;

      const post = dashboardFeed.querySelector(`[data-post-id="${postId}"]`);
      if (!post) return false;

      post.remove();
      updateDashboardEmptyState();
      return true;
    }

    function scheduleDashboardRealtimeRefresh(reason = 'record-change') {
      if (!isInternalUserSignedIn()) return;

      if (RealtimeRuntime.dashboardRefreshTimer) {
        clearTimeout(RealtimeRuntime.dashboardRefreshTimer);
      }

      RealtimeRuntime.dashboardRefreshTimer = setTimeout(() => {
        RealtimeRuntime.dashboardRefreshTimer = null;

        if (currentRoute !== ROUTES.DASHBOARD && !DashboardRuntime.loaded) return;
        ensureDashboardRecordsLoaded({ force: true });
        dispatchRealtimeEvent('record-refresh', { reason });
      }, 650);
    }

    function prepareDashboardRealtimeHooks() {
      if (RealtimeRuntime.dashboardChannel && RealtimeRuntime.attachmentChannel) return;

      if (!DASHBOARD_DATA_CONFIG.realtimeEnabled || getInternalMode() !== 'supabase' || !isInternalUserSignedIn()) {
        dispatchRealtimeEvent('record-skipped', {
          enabled: DASHBOARD_DATA_CONFIG.realtimeEnabled,
          channel: DASHBOARD_DATA_CONFIG.defaultChannel,
          table: DASHBOARD_DATA_CONFIG.table
        });
        return;
      }

      const client = createInternalSupabaseClient();
      if (!client?.channel) {
        dispatchRealtimeEvent('record-unavailable', { table: DASHBOARD_DATA_CONFIG.table });
        return;
      }

      if (!RealtimeRuntime.dashboardChannel) {
        const recordChannel = client
          .channel(`moscatelli-record-${DASHBOARD_DATA_CONFIG.defaultChannel}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: DASHBOARD_DATA_CONFIG.table,
            filter: `channel=eq.${DASHBOARD_DATA_CONFIG.defaultChannel}`
          }, payload => {
            scheduleDashboardRealtimeRefresh('record-insert');
            dispatchRealtimeEvent('record-insert', { postId: payload.new?.id || null });
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: DASHBOARD_DATA_CONFIG.table,
            filter: `channel=eq.${DASHBOARD_DATA_CONFIG.defaultChannel}`
          }, payload => {
            scheduleDashboardRealtimeRefresh('record-update');
            dispatchRealtimeEvent('record-update', { postId: payload.new?.id || null });
          })
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: DASHBOARD_DATA_CONFIG.table,
            filter: `channel=eq.${DASHBOARD_DATA_CONFIG.defaultChannel}`
          }, payload => {
            const postId = payload.old?.id || null;
            if (postId) removeDashboardPostById(postId);
            scheduleDashboardRealtimeRefresh('record-delete');
            dispatchRealtimeEvent('record-delete', { postId });
          })
          .subscribe(status => {
            RealtimeRuntime.status = status;
            dispatchRealtimeEvent('record-status', { status, channel: DASHBOARD_DATA_CONFIG.defaultChannel, table: DASHBOARD_DATA_CONFIG.table });
          });

        RealtimeRuntime.dashboardChannel = recordChannel;
      }

      if (!RealtimeRuntime.attachmentChannel) {
        const attachmentChannel = client
          .channel(`moscatelli-record-attachments-${DASHBOARD_DATA_CONFIG.defaultChannel}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: DASHBOARD_DATA_CONFIG.attachmentsTable
          }, payload => {
            scheduleDashboardRealtimeRefresh('record-attachment-change');
            dispatchRealtimeEvent('record-attachment-change', {
              attachmentId: payload.new?.id || payload.old?.id || null,
              postId: payload.new?.post_id || payload.old?.post_id || null
            });
          })
          .subscribe(status => {
            dispatchRealtimeEvent('record-attachments-status', { status, table: DASHBOARD_DATA_CONFIG.attachmentsTable });
          });

        RealtimeRuntime.attachmentChannel = attachmentChannel;
      }
    }

    async function createDashboardPost(payload = dashboardRecordFromComposer()) {
      if (!dashboardFeed || !isInternalUserSignedIn()) {
        setCommitState('idle');
        setDashboardComposerFeedback(
          dashboardFeedbackText('dashboard.feedback.auth', 'Sign in again before entering the Record.'),
          'error'
        );
        setInternalAuthStatus('signed_out');
        updateInternalAccessUI();
        return null;
      }

      try {
        const attachments = await InternalData.attachments.fromComposer(payload.attachments);

        const record = await InternalData.posts.create({
          ...payload,
          attachments
        });

        if (!record) {
          setDashboardComposerFeedback(
            dashboardFeedbackText('dashboard.feedback.error', 'The entry could not be recorded. Please try again.'),
            'error'
          );
          return null;
        }

        renderDashboardPostRecord(record, { prepend: true });
        sortDashboardPostsByDate();
        setDashboardFilter(dashboardCurrentFilter);
        DashboardRuntime.loaded = true;

        if (record.attachment_errors?.length) {
          setDashboardComposerFeedback(
            dashboardFeedbackText('dashboard.feedback.attachErrors', 'Entry recorded, but one or more plates could not be attached.'),
            'warning'
          );
        }

        return record;
      } catch (error) {
        setDashboardComposerFeedback(
          dashboardFeedbackText('dashboard.feedback.error', 'The entry could not be recorded. Please try again.'),
          'error'
        );
        window.dispatchEvent(new CustomEvent('moscatelli:record-create-error', { detail: { error } }));
        return null;
      }
    }

    dashboardCommitEntry?.addEventListener('click', () => {
      if (dashboardCommitInFlight) return;

      const payload = dashboardRecordFromComposer();
      if (!validateDashboardRecord(payload)) return;

      dashboardCommitInFlight = true;
      setDashboardComposerFeedback('');
      setCommitState('pending');

      setTimeout(async () => {
        const record = await createDashboardPost(payload);
        dashboardCommitInFlight = false;

        if (record) {
          const hadAttachmentErrors = Boolean(record.attachment_errors?.length);
          resetDashboardComposer({
            preserveAttachmentUrls: record.source === 'mock',
            preserveFeedback: hadAttachmentErrors
          });
          setCommitState('confirmed');

          if (hadAttachmentErrors) {
            setDashboardComposerFeedback(
              dashboardFeedbackText('dashboard.feedback.attachErrors', 'Entry recorded, but one or more plates could not be attached.'),
              'warning'
            );
          } else {
            setTimeout(() => closeDashboardComposer({ reset: false }), 520);
          }
        } else {
          setCommitState('idle');
        }
      }, 240);
    });

    dashboardFeed?.addEventListener('click', async event => {
      const deleteButton = event.target.closest('[data-delete-owned-entry]');
      if (!deleteButton) return;

      const post = deleteButton.closest('.dashboard-post');
      if (!post || post.dataset.canDelete !== 'true') return;

      const removal = await InternalData.posts.remove(post.dataset.postId);
      if (!removal.ok) return;

      post.classList.add('is-removing');

      setTimeout(async () => {
        const blobUrls = Array.from(post.querySelectorAll('.dashboard-post-attachments img'))
          .map(img => img.src)
          .filter(src => src?.startsWith('blob:'));

        await InternalData.attachments.cleanupBlobUrls(blobUrls);
        post.remove();
        updateDashboardEmptyState();
        setCommitState('idle');
      }, 220);
    });

    function toggleDashboardFilter() {
      const isOpen = dashboardFilter?.classList.toggle('is-open');
      dashboardFilterTrigger?.setAttribute('aria-expanded', String(Boolean(isOpen)));
    }

    dashboardFilterTrigger?.addEventListener('click', toggleDashboardFilter);

    dashboardFilterMenu?.addEventListener('click', event => {
      const option = event.target.closest('[data-filter]');
      if (!option) return;
      setDashboardFilter(option.dataset.filter);
    });

    document.addEventListener('click', event => {
      if (!dashboardFilter?.contains(event.target)) {
        dashboardFilter?.classList.remove('is-open');
        dashboardFilterTrigger?.setAttribute('aria-expanded', 'false');
      }

      if (!dashboardEntryCategory?.contains(event.target)) {
        closeEntryCategory();
      }
    });

    async function resizeDashboardImage(file) {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.76));
      return {
        blob,
        url: URL.createObjectURL(blob),
        originalSize: file.size,
        resizedSize: blob?.size || file.size,
        mimeType: blob?.type || 'image/jpeg',
        fileName: file.name || 'plate.jpg'
      };
    }

    function formatBytes(bytes) {
      if (!bytes) return '0 KB';
      const kb = bytes / 1024;
      if (kb < 1024) return `${Math.round(kb)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    }

    function renderDashboardAttachments() {
      if (!dashboardAttachments) return;

      dashboardAttachments.innerHTML = '';

      dashboardLocalAttachments.forEach((attachment, index) => {
        const item = document.createElement('div');
        item.className = 'dashboard-attachment';
        item.dataset.attachmentIndex = String(index);

        const img = document.createElement('img');
        img.src = attachment.url;
        img.alt = '';

        const label = document.createElement('span');
        label.textContent = `${formatBytes(attachment.originalSize)} → ${formatBytes(attachment.resizedSize)}`;

        const remove = document.createElement('button');
        remove.className = 'dashboard-attachment-remove';
        remove.type = 'button';
        remove.dataset.removeAttachment = String(index);
        remove.setAttribute('aria-label', 'Remove attachment');
        remove.textContent = '×';

        item.append(img, label, remove);
        dashboardAttachments.appendChild(item);
      });

      dashboardAttachmentLimit?.classList.toggle('is-visible', dashboardLocalAttachments.length >= DASHBOARD_DATA_CONFIG.maxAttachments);
    }

    function removeDashboardAttachment(index) {
      const attachment = dashboardLocalAttachments[index];
      if (attachment?.url) URL.revokeObjectURL(attachment.url);

      dashboardLocalAttachments.splice(index, 1);
      renderDashboardAttachments();

      if (dashboardAttachmentInput) dashboardAttachmentInput.value = '';
    }

    dashboardFeed?.addEventListener('click', async event => {
      const trigger = event.target.closest('.dashboard-attachment-open');
      if (!trigger) return;

      const group = trigger.closest('.dashboard-post-attachments');
      const buttons = Array.from(group?.querySelectorAll('.dashboard-attachment-open') || []);
      const items = buttons.map(attachmentDataFromElement).filter(Boolean);
      const index = Math.max(0, buttons.indexOf(trigger));

      await openRecordAttachmentViewer(items, index, trigger);
    });

    recordAttachmentViewerClose?.addEventListener('click', () => closeRecordAttachmentViewer());
    recordAttachmentViewer?.addEventListener('click', event => {
      if (event.target.closest('[data-record-lightbox-close]')) closeRecordAttachmentViewer();
    });
    recordAttachmentViewerPrev?.addEventListener('click', () => moveRecordAttachmentViewer(-1));
    recordAttachmentViewerNext?.addEventListener('click', () => moveRecordAttachmentViewer(1));
    recordAttachmentViewerImage?.addEventListener('error', async () => {
      const item = recordAttachmentViewerItems[recordAttachmentViewerIndex];
      if (!item || item.refreshAttempted) return;
      item.refreshAttempted = true;
      const signedUrl = await refreshRecordAttachmentViewerItem(item);
      if (signedUrl && recordAttachmentViewerImage) recordAttachmentViewerImage.src = signedUrl;
    });
    document.addEventListener('keydown', event => {
      if (!recordAttachmentViewer || recordAttachmentViewer.hidden) return;
      if (event.key === 'Escape') closeRecordAttachmentViewer();
      if (event.key === 'ArrowLeft') moveRecordAttachmentViewer(-1);
      if (event.key === 'ArrowRight') moveRecordAttachmentViewer(1);
    });

    dashboardAttachments?.addEventListener('click', event => {
      const remove = event.target.closest('[data-remove-attachment]');
      if (!remove) return;

      removeDashboardAttachment(Number(remove.dataset.removeAttachment));
    });

    dashboardAttachmentInput?.addEventListener('change', async event => {
      const selectedFiles = Array.from(event.target.files || []);
      const files = selectedFiles.filter(file => file.type.startsWith('image/'));

      if (selectedFiles.length && files.length < selectedFiles.length) {
        setDashboardComposerFeedback(
          dashboardFeedbackText('dashboard.feedback.attachInvalid', 'Only image files may be attached.'),
          'warning'
        );
      }

      if (!files.length || !dashboardAttachments) {
        if (dashboardAttachmentInput) dashboardAttachmentInput.value = '';
        return;
      }

      const remainingSlots = Math.max(0, DASHBOARD_DATA_CONFIG.maxAttachments - dashboardLocalAttachments.length);
      if (!remainingSlots) {
        setDashboardComposerFeedback(
          dashboardFeedbackText('dashboard.feedback.attachLimit', 'Only four plates may be attached.'),
          'warning'
        );
        if (dashboardAttachmentInput) dashboardAttachmentInput.value = '';
        return;
      }

      const acceptedFiles = files.slice(0, remainingSlots);
      if (files.length > acceptedFiles.length) {
        setDashboardComposerFeedback(
          dashboardFeedbackText('dashboard.feedback.attachLimit', 'Only four plates may be attached.'),
          'warning'
        );
      }

      for (const file of acceptedFiles) {
        try {
          const resized = await resizeDashboardImage(file);
          dashboardLocalAttachments.push(resized);
        } catch (error) {
          setDashboardComposerFeedback(
            dashboardFeedbackText('dashboard.feedback.attachResize', 'One plate could not be prepared for preview.'),
            'warning'
          );
          window.dispatchEvent(new CustomEvent('moscatelli:record-attachment-resize-error', { detail: { error, fileName: file.name } }));
        }
      }

      renderDashboardAttachments();

      if (dashboardAttachmentInput) dashboardAttachmentInput.value = '';
    });


    function clearDeskThread() {
      stopDeskAuthoritativeSync();
      deskThread?.querySelectorAll('.desk-message').forEach(message => message.remove());
      if (deskThread && deskEmpty && !deskThread.contains(deskEmpty)) deskThread.appendChild(deskEmpty);
      DeskRuntime.loaded = false;
      DeskRuntime.lastSignature = '';
    }

    function clearInternalRuntimeViews() {
      releaseAllRealtime();
      closeRecordAttachmentViewer({ restoreFocus: false });
      clearDashboardPosts();
    }

    function loadVisibleInternalRuntimeViews({ force = false } = {}) {
      if (!isInternalUserSignedIn()) return;

      prepareDashboardRealtimeHooks();

      if (currentRoute === ROUTES.DASHBOARD) {
        ensureDashboardRecordsLoaded({ force });
      }
    }

    window.addEventListener('moscatelli:internal-user', event => {
      releaseAllRealtime();
      DashboardRuntime.loaded = false;
      DeskRuntime.loaded = false;
      loadVisibleInternalRuntimeViews({ force: true });
    });

    window.addEventListener('moscatelli:internal-route-protection', event => {
      if (event.detail?.signedIn) loadVisibleInternalRuntimeViews();
    });

    window.addEventListener('moscatelli:internal-sign-out', clearInternalRuntimeViews);
    window.addEventListener('moscatelli:internal-inactive-user', clearInternalRuntimeViews);

    queueMicrotask(() => loadVisibleInternalRuntimeViews());

    // ── Swipe-left to close nav on touch devices ──
    let touchStartX = 0;
    sideNav.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    sideNav.addEventListener('touchend', e => {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (delta > 52) closeNav(); // swipe left ≥ 52px closes the panel
    }, { passive: true });
  