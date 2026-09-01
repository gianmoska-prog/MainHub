(() => {
  'use strict';

  const TABLES = Object.freeze({ social: 'marketing_social_items', contacts: 'marketing_contacts', projects: 'marketing_projects' });
  const PLATFORM_LABELS = Object.freeze({ instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', tiktok: 'TikTok' });
  const STATUS_KEYS = Object.freeze({ idea:'marketing.status.idea', draft:'marketing.status.draft', scheduled:'marketing.status.scheduled', published:'marketing.status.published', paused:'marketing.status.paused', completed:'marketing.status.completed', future:'marketing.status.future', ongoing:'marketing.status.ongoing', prospect:'marketing.status.prospect', introduced:'marketing.status.introduced', active:'marketing.status.active', partner:'marketing.status.partner', dormant:'marketing.status.dormant' });
  const PROJECT_TYPE_KEYS = Object.freeze({ campaign:'marketing.projectType.campaign', partnership:'marketing.projectType.partnership', event:'marketing.projectType.event', editorial:'marketing.projectType.editorial', networking:'marketing.projectType.networking', other:'marketing.projectType.other' });

  const state = {
    social: [], contacts: [], projects: [],
    platform: 'instagram', socialType: 'post', contactStage: 'all', contactQuery: '', projectFilter: 'all',
    loaded: { social:false, contacts:false, projects:false }, channel: null, selectedContactId: null
  };

  const $ = id => document.getElementById(id);
  const text = value => String(value ?? '').trim();
  const html = value => String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
  const i18n = (key, fallback = '', values = {}) => {
    const template = window.MainHubI18n?.text?.(key, fallback) || fallback;
    return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), template);
  };
  const statusLabel = value => i18n(STATUS_KEYS[value], value);
  const projectTypeLabel = value => i18n(PROJECT_TYPE_KEYS[value], value);
  const locale = () => window.MainHubI18n?.language === 'pt' ? 'pt-BR' : 'en-GB';
  const client = () => typeof InternalState !== 'undefined' ? InternalState.supabaseClient : null;
  const signedIn = () => typeof isInternalUserSignedIn === 'function' && isInternalUserSignedIn();
  const currentUserId = () => InternalState?.user?.id || InternalState?.session?.user?.id || '';
  const canDelete = row => InternalState?.user?.role === 'founder' || row.created_by === currentUserId();

  function formatDate(value, withTime = false) {
    if (!value) return i18n('marketing.notSet', 'Not set');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale(), withTime ? { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' } : { day:'numeric', month:'short', year:'numeric', timeZone:/^\d{4}-\d{2}-\d{2}$/.test(value)?'UTC':undefined }).format(date);
  }

  function money(amount, currency = 'EUR') {
    if (amount === null || amount === undefined || amount === '') return '—';
    try { return new Intl.NumberFormat(locale(), { style:'currency', currency:currency || 'EUR', maximumFractionDigits:2 }).format(Number(amount)); }
    catch { return `${currency || 'EUR'} ${Number(amount).toFixed(2)}`; }
  }

  function validUrl(value) {
    if (!value) return true;
    try { const parsed = new URL(value); return parsed.protocol === 'http:' || parsed.protocol === 'https:'; }
    catch { return false; }
  }

  function validEmail(value) {
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setStatus(id, message = '', error = false) {
    const node = $(id); if (!node) return;
    node.textContent = message;
    node.dataset.error = error ? 'true' : 'false';
  }

  function openDialog(dialog, firstInput) {
    if (!dialog) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    }
    requestAnimationFrame(() => firstInput?.focus());
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  }

  async function loadOverview() {
    const db = client(); if (!db || !signedIn()) return;
    const [social, contacts, projects] = await Promise.all([
      db.from(TABLES.social).select('id', { count:'exact', head:true }),
      db.from(TABLES.contacts).select('id', { count:'exact', head:true }),
      db.from(TABLES.projects).select('id', { count:'exact', head:true }).eq('status','ongoing')
    ]);
    if (!social.error && $('marketingOverviewSocial')) $('marketingOverviewSocial').textContent = social.count ?? 0;
    if (!contacts.error && $('marketingOverviewContacts')) $('marketingOverviewContacts').textContent = contacts.count ?? 0;
    if (!projects.error && $('marketingOverviewProjects')) $('marketingOverviewProjects').textContent = projects.count ?? 0;
  }

  async function loadSocial(force = false) {
    if (state.loaded.social && !force) { renderSocial(); return; }
    const db = client(); if (!db || !signedIn()) return;
    setStatus('marketingSocialStatus', i18n('marketing.social.loading', 'Loading publishing register…'));
    const { data, error } = await db.from(TABLES.social).select('*').order('scheduled_for', { ascending:true, nullsFirst:false }).order('updated_at', { ascending:false }).limit(500);
    if (error) { setStatus('marketingSocialStatus', i18n('marketing.social.error.load', 'Unable to load the publishing register.'), true); return; }
    state.social = data || []; state.loaded.social = true; setStatus('marketingSocialStatus'); renderSocial();
  }

  function renderSocial() {
    const list = $('marketingSocialList'), empty = $('marketingSocialEmpty'); if (!list) return;
    const records = state.social.filter(item => item.platform === state.platform && item.item_type === state.socialType);
    $('marketingSocialPlatformLabel').textContent = PLATFORM_LABELS[state.platform];
    list.innerHTML = records.map(item => {
      const summary = text(item.objective) || text(item.content) || i18n('marketing.social.noNotes', 'No working note has been added.');
      const meta = [
        item.owner && i18n('marketing.meta.owner', 'Owner · {value}', { value:item.owner }),
        item.campaign_name && i18n('marketing.meta.campaign', 'Campaign · {value}', { value:item.campaign_name }),
        item.item_type === 'ad' && item.budget !== null && i18n('marketing.meta.budget', 'Budget · {value}', { value:money(item.budget,item.currency) })
      ].filter(Boolean);
      return `<article class="marketing-social-item" data-id="${html(item.id)}">
        <div class="marketing-item-top"><span class="marketing-status-pill">${html(statusLabel(item.status))}</span><span class="marketing-item-date">${html(item.scheduled_for ? formatDate(item.scheduled_for,true) : i18n('marketing.social.unscheduled', 'Unscheduled'))}</span></div>
        <div><h3>${html(item.title)}</h3><p>${html(summary)}</p></div>
        <div class="marketing-item-bottom"><div class="marketing-item-meta">${meta.map(value=>`<span>${html(value)}</span>`).join('')}</div><div class="marketing-row-actions"><button type="button" data-social-edit="${html(item.id)}">${html(i18n('marketing.action.edit', 'Edit'))}</button>${canDelete(item)?`<button class="is-danger" type="button" data-social-delete="${html(item.id)}">${html(i18n('marketing.action.delete', 'Delete'))}</button>`:''}</div></div>
      </article>`;
    }).join('');
    empty.hidden = records.length !== 0;
  }

  function socialRecord(id) { return state.social.find(item => item.id === id); }

  function openSocialEditor(record = null) {
    $('marketingSocialForm').reset(); $('marketingSocialCurrency').value = 'EUR';
    $('marketingSocialId').value = record?.id || '';
    const dialogTitleKey = record ? 'marketing.social.dialog.edit' : 'marketing.social.dialog.new';
    $('marketingSocialDialogTitle').dataset.i18n = dialogTitleKey;
    $('marketingSocialDialogTitle').textContent = i18n(dialogTitleKey, record ? 'Edit social item' : 'New social item');
    $('marketingSocialTitle').value = record?.title || '';
    $('marketingSocialPlatform').value = record?.platform || state.platform;
    $('marketingSocialType').value = record?.item_type || state.socialType;
    $('marketingSocialItemStatus').value = record?.status || 'idea';
    $('marketingSocialOwner').value = record?.owner || '';
    $('marketingSocialScheduled').value = record?.scheduled_for ? new Date(record.scheduled_for).toISOString().slice(0,16) : '';
    $('marketingSocialCampaign').value = record?.campaign_name || '';
    $('marketingSocialObjective').value = record?.objective || '';
    $('marketingSocialContent').value = record?.content || '';
    $('marketingSocialUrl').value = record?.destination_url || '';
    $('marketingSocialBudget').value = record?.budget ?? '';
    $('marketingSocialCurrency').value = record?.currency || 'EUR';
    $('marketingSocialFeedback').textContent = '';
    openDialog($('marketingSocialDialog'), $('marketingSocialTitle'));
  }

  async function saveSocial(event) {
    event.preventDefault();
    const id = $('marketingSocialId').value;
    const payload = {
      title:text($('marketingSocialTitle').value), platform:$('marketingSocialPlatform').value, item_type:$('marketingSocialType').value,
      status:$('marketingSocialItemStatus').value, owner:text($('marketingSocialOwner').value),
      scheduled_for:$('marketingSocialScheduled').value ? new Date($('marketingSocialScheduled').value).toISOString() : null,
      campaign_name:text($('marketingSocialCampaign').value), objective:text($('marketingSocialObjective').value), content:text($('marketingSocialContent').value),
      destination_url:text($('marketingSocialUrl').value), budget:$('marketingSocialBudget').value === '' ? null : Number($('marketingSocialBudget').value), currency:text($('marketingSocialCurrency').value).toUpperCase() || 'EUR'
    };
    if (!payload.title) { $('marketingSocialFeedback').textContent = i18n('marketing.validation.title', 'A title is required.'); return; }
    if (!validUrl(payload.destination_url)) { $('marketingSocialFeedback').textContent = i18n('marketing.validation.url', 'Enter a valid web address, including https://.'); return; }
    if (payload.budget !== null && payload.budget < 0) { $('marketingSocialFeedback').textContent = i18n('marketing.validation.budget', 'Budget must be zero or greater.'); return; }
    $('marketingSocialFeedback').textContent = i18n('marketing.saving', 'Saving…');
    const query = id ? client().from(TABLES.social).update(payload).eq('id',id) : client().from(TABLES.social).insert(payload);
    const { error } = await query;
    if (error) { $('marketingSocialFeedback').textContent = i18n('marketing.social.error.save', 'The social item could not be saved.'); return; }
    state.platform = payload.platform; state.socialType = payload.item_type; closeDialog($('marketingSocialDialog')); await loadSocial(true); syncSocialTabs(); await loadOverview();
  }

  async function deleteSocial(id) {
    const record = socialRecord(id); if (!record || !confirm(i18n('marketing.social.deleteConfirm', 'Delete “{title}”?', { title:record.title }))) return;
    const { error } = await client().from(TABLES.social).delete().eq('id',id);
    if (error) { setStatus('marketingSocialStatus', i18n('marketing.social.error.delete', 'The social item could not be deleted.'), true); return; }
    await loadSocial(true); await loadOverview();
  }

  function syncSocialTabs() {
    document.querySelectorAll('#marketingPlatformTabs [data-platform]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.platform === state.platform)));
    document.querySelectorAll('#marketingSocialTypeTabs [data-social-type]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.socialType === state.socialType)));
  }

  async function loadContacts(force = false) {
    if (state.loaded.contacts && !force) { renderContacts(); return; }
    const db = client(); if (!db || !signedIn()) return;
    setStatus('marketingContactsStatus', i18n('marketing.contacts.loading', 'Loading directory…'));
    const { data, error } = await db.from(TABLES.contacts).select('*').order('full_name').limit(1000);
    if (error) { setStatus('marketingContactsStatus', i18n('marketing.contacts.error.load', 'Unable to load contacts.'), true); return; }
    state.contacts = data || []; state.loaded.contacts = true; setStatus('marketingContactsStatus'); renderContacts();
  }

  function visibleContacts() {
    const needle = state.contactQuery.toLowerCase();
    return state.contacts.filter(contact => (state.contactStage === 'all' || contact.relationship_stage === state.contactStage) && (!needle || [contact.full_name,contact.organisation,contact.role_area,contact.country,contact.city].join(' ').toLowerCase().includes(needle)));
  }

  function renderContacts() {
    const list = $('marketingContactsList'), empty = $('marketingContactsEmpty'); if (!list) return;
    const records = visibleContacts(); $('marketingContactCount').textContent = records.length;
    list.innerHTML = records.map(contact => `<article class="marketing-contact-card">
      <header><div><h3>${html(contact.full_name)}</h3><div class="marketing-contact-org">${html(contact.organisation || i18n('marketing.contacts.independent', 'Independent'))}</div></div><span class="marketing-contact-stage">${html(statusLabel(contact.relationship_stage))}</span></header>
      <div class="marketing-contact-context"><span>${html(contact.role_area || i18n('marketing.contacts.areaMissing', 'Area not specified'))}</span><span>${html([contact.city,contact.country].filter(Boolean).join(' · ') || i18n('marketing.contacts.locationMissing', 'Location not specified'))}</span></div>
      <footer><button class="marketing-details-button" type="button" data-contact-details="${html(contact.id)}">${html(i18n('marketing.action.details', 'Personal details →'))}</button><div class="marketing-row-actions"><button type="button" data-contact-edit="${html(contact.id)}">${html(i18n('marketing.action.edit', 'Edit'))}</button>${canDelete(contact)?`<button class="is-danger" type="button" data-contact-delete="${html(contact.id)}">${html(i18n('marketing.action.delete', 'Delete'))}</button>`:''}</div></footer>
    </article>`).join('');
    empty.hidden = records.length !== 0;
  }

  function contactRecord(id) { return state.contacts.find(item => item.id === id); }

  function openContactEditor(contact = null) {
    closeDialog($('marketingContactDetailDialog')); $('marketingContactForm').reset();
    $('marketingContactId').value=contact?.id||'';
    const dialogTitleKey=contact?'marketing.contacts.dialog.edit':'marketing.contacts.dialog.new';
    $('marketingContactDialogTitle').dataset.i18n=dialogTitleKey;
    $('marketingContactDialogTitle').textContent=i18n(dialogTitleKey,contact?'Edit contact':'New contact');
    const fields = { marketingContactName:'full_name',marketingContactOrganisation:'organisation',marketingContactArea:'role_area',marketingContactStage:'relationship_stage',marketingContactCountry:'country',marketingContactCity:'city',marketingContactEmail:'email',marketingContactPhone:'phone',marketingContactInstagram:'instagram_url',marketingContactLinkedin:'linkedin_url',marketingContactWebsite:'website_url',marketingContactNotes:'notes' };
    Object.entries(fields).forEach(([id,key]) => { $(id).value=contact?.[key] || (id==='marketingContactStage'?'prospect':''); });
    $('marketingContactFeedback').textContent=''; openDialog($('marketingContactDialog'),$('marketingContactName'));
  }

  async function saveContact(event) {
    event.preventDefault(); const id=$('marketingContactId').value;
    const payload={full_name:text($('marketingContactName').value),organisation:text($('marketingContactOrganisation').value),role_area:text($('marketingContactArea').value),relationship_stage:$('marketingContactStage').value,country:text($('marketingContactCountry').value),city:text($('marketingContactCity').value),email:text($('marketingContactEmail').value),phone:text($('marketingContactPhone').value),instagram_url:text($('marketingContactInstagram').value),linkedin_url:text($('marketingContactLinkedin').value),website_url:text($('marketingContactWebsite').value),notes:text($('marketingContactNotes').value)};
    if(!payload.full_name){$('marketingContactFeedback').textContent=i18n('marketing.validation.name','A full name is required.');return}
    if(!validEmail(payload.email)){$('marketingContactFeedback').textContent=i18n('marketing.validation.email','Enter a valid email address.');return}
    if(![payload.instagram_url,payload.linkedin_url,payload.website_url].every(validUrl)){$('marketingContactFeedback').textContent=i18n('marketing.validation.url','Enter a valid web address, including https://.');return}
    $('marketingContactFeedback').textContent=i18n('marketing.saving','Saving…');
    const query=id?client().from(TABLES.contacts).update(payload).eq('id',id):client().from(TABLES.contacts).insert(payload); const{error}=await query;
    if(error){$('marketingContactFeedback').textContent=i18n('marketing.contacts.error.save','The contact could not be saved.');return} closeDialog($('marketingContactDialog')); await loadContacts(true); await loadOverview();
  }

  function detailLink(label,value,type='url') {
    if(!value)return `<div><dt>${html(label)}</dt><dd>${html(i18n('marketing.contacts.notProvided','Not provided'))}</dd></div>`;
    const href=type==='email'?`mailto:${value}`:type==='phone'?`tel:${value.replace(/[^+\d]/g,'')}`:value;
    return `<div><dt>${html(label)}</dt><dd><a href="${html(href)}" ${type==='url'?'target="_blank" rel="noopener noreferrer"':''}>${html(value)}</a></dd></div>`;
  }

  function showContactDetails(id) {
    const contact=contactRecord(id);if(!contact)return;state.selectedContactId=id;
    $('marketingContactDetailName').textContent=contact.full_name;
    $('marketingContactDetailRole').textContent=[contact.role_area,contact.organisation,[contact.city,contact.country].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
    $('marketingContactDetailList').innerHTML=detailLink('Email',contact.email,'email')+detailLink(i18n('marketing.field.phone','Phone'),contact.phone,'phone')+detailLink('Instagram',contact.instagram_url)+detailLink('LinkedIn',contact.linkedin_url)+detailLink(i18n('marketing.field.website','Website / other link'),contact.website_url)+`<div><dt>${html(i18n('marketing.field.relationship','Relationship'))}</dt><dd>${html(statusLabel(contact.relationship_stage))}</dd></div>`;
    $('marketingContactDetailNotes').textContent=contact.notes||i18n('marketing.contacts.notesMissing','No private notes have been added.'); openDialog($('marketingContactDetailDialog'));
  }

  async function deleteContact(id){const record=contactRecord(id);if(!record||!confirm(i18n('marketing.contacts.deleteConfirm','Delete {name} from the directory?',{name:record.full_name})))return;const{error}=await client().from(TABLES.contacts).delete().eq('id',id);if(error){setStatus('marketingContactsStatus',i18n('marketing.contacts.error.delete','The contact could not be deleted.'),true);return}await loadContacts(true);await loadOverview()}

  async function loadProjects(force=false){if(state.loaded.projects&&!force){renderProjects();return}const db=client();if(!db||!signedIn())return;setStatus('marketingProjectsStatus',i18n('marketing.projects.loading','Loading project register…'));const{data,error}=await db.from(TABLES.projects).select('*').order('target_date',{ascending:true,nullsFirst:false}).order('updated_at',{ascending:false}).limit(500);if(error){setStatus('marketingProjectsStatus',i18n('marketing.projects.error.load','Unable to load projects.'),true);return}state.projects=data||[];state.loaded.projects=true;setStatus('marketingProjectsStatus');renderProjects()}

  function projectRecord(id){return state.projects.find(item=>item.id===id)}
  function renderProjects(){const list=$('marketingProjectsList'),empty=$('marketingProjectsEmpty');if(!list)return;const records=state.projects.filter(project=>state.projectFilter==='all'||project.status===state.projectFilter);list.innerHTML=records.map(project=>`<article class="marketing-project-row"><div><h3>${html(project.title)}</h3><p>${html(project.objective||project.next_action||i18n('marketing.projects.noObjective','No objective recorded.'))}</p></div><div class="marketing-project-cell marketing-project-status"><span>${html(i18n('marketing.field.status','Status'))}</span><span>${html(statusLabel(project.status))}</span></div><div class="marketing-project-cell"><span>${html(i18n('marketing.field.type','Type'))}</span><span>${html(projectTypeLabel(project.project_type))}</span></div><div class="marketing-project-cell marketing-project-country"><span>${html(i18n('marketing.field.country','Country'))}</span><span>${html(project.country||'—')}</span></div><div class="marketing-project-cell"><span>${html(i18n('marketing.field.targetDate','Target date'))}</span><span>${html(project.target_date?formatDate(project.target_date):i18n('marketing.projects.openTarget','Open'))}</span></div><div class="marketing-row-actions"><button type="button" data-project-edit="${html(project.id)}">${html(i18n('marketing.action.edit','Edit'))}</button>${canDelete(project)?`<button class="is-danger" type="button" data-project-delete="${html(project.id)}">${html(i18n('marketing.action.delete','Delete'))}</button>`:''}</div></article>`).join('');empty.hidden=records.length!==0}

  function openProjectEditor(project=null){$('marketingProjectForm').reset();$('marketingProjectCurrency').value='EUR';$('marketingProjectId').value=project?.id||'';const dialogTitleKey=project?'marketing.projects.dialog.edit':'marketing.projects.dialog.new';$('marketingProjectDialogTitle').dataset.i18n=dialogTitleKey;$('marketingProjectDialogTitle').textContent=i18n(dialogTitleKey,project?'Edit project':'New project');const fields={marketingProjectTitle:'title',marketingProjectStatus:'status',marketingProjectType:'project_type',marketingProjectLead:'lead',marketingProjectCountry:'country',marketingProjectStart:'start_date',marketingProjectTarget:'target_date',marketingProjectBudget:'budget',marketingProjectCurrency:'currency',marketingProjectObjective:'objective',marketingProjectNext:'next_action',marketingProjectNotes:'notes'};Object.entries(fields).forEach(([id,key])=>{$(id).value=project?.[key]??(id==='marketingProjectStatus'?'future':id==='marketingProjectType'?'other':id==='marketingProjectCurrency'?'EUR':'')});$('marketingProjectFeedback').textContent='';openDialog($('marketingProjectDialog'),$('marketingProjectTitle'))}

  async function saveProject(event){event.preventDefault();const id=$('marketingProjectId').value;const payload={title:text($('marketingProjectTitle').value),status:$('marketingProjectStatus').value,project_type:$('marketingProjectType').value,lead:text($('marketingProjectLead').value),country:text($('marketingProjectCountry').value),start_date:$('marketingProjectStart').value||null,target_date:$('marketingProjectTarget').value||null,budget:$('marketingProjectBudget').value===''?null:Number($('marketingProjectBudget').value),currency:text($('marketingProjectCurrency').value).toUpperCase()||'EUR',objective:text($('marketingProjectObjective').value),next_action:text($('marketingProjectNext').value),notes:text($('marketingProjectNotes').value)};if(!payload.title){$('marketingProjectFeedback').textContent=i18n('marketing.validation.projectTitle','A project title is required.');return}if(payload.start_date&&payload.target_date&&payload.target_date<payload.start_date){$('marketingProjectFeedback').textContent=i18n('marketing.validation.dates','The target date cannot precede the start date.');return}if(payload.budget!==null&&payload.budget<0){$('marketingProjectFeedback').textContent=i18n('marketing.validation.budget','Budget must be zero or greater.');return}$('marketingProjectFeedback').textContent=i18n('marketing.saving','Saving…');const query=id?client().from(TABLES.projects).update(payload).eq('id',id):client().from(TABLES.projects).insert(payload);const{error}=await query;if(error){$('marketingProjectFeedback').textContent=i18n('marketing.projects.error.save','The project could not be saved.');return}closeDialog($('marketingProjectDialog'));await loadProjects(true);await loadOverview()}
  async function deleteProject(id){const record=projectRecord(id);if(!record||!confirm(i18n('marketing.projects.deleteConfirm','Delete “{title}”?',{title:record.title})))return;const{error}=await client().from(TABLES.projects).delete().eq('id',id);if(error){setStatus('marketingProjectsStatus',i18n('marketing.projects.error.delete','The project could not be deleted.'),true);return}await loadProjects(true);await loadOverview()}

  function setupRealtime(){const db=client();if(!db||state.channel)return;state.channel=db.channel('mainhub-marketing-workspace').on('postgres_changes',{event:'*',schema:'public',table:TABLES.social},()=>{state.loaded.social=false;if(currentRoute===ROUTES.MARKETING_SOCIAL)loadSocial(true);loadOverview()}).on('postgres_changes',{event:'*',schema:'public',table:TABLES.contacts},()=>{state.loaded.contacts=false;if(currentRoute===ROUTES.MARKETING_CONTACTS)loadContacts(true);loadOverview()}).on('postgres_changes',{event:'*',schema:'public',table:TABLES.projects},()=>{state.loaded.projects=false;if(currentRoute===ROUTES.MARKETING_PROJECTS)loadProjects(true);loadOverview()}).subscribe()}

  async function onRoute(route){if(!String(route||'').startsWith('divisions/marketing')||!signedIn())return;setupRealtime();if(route===ROUTES.MARKETING)await loadOverview();else if(route===ROUTES.MARKETING_SOCIAL)await loadSocial();else if(route===ROUTES.MARKETING_CONTACTS)await loadContacts();else if(route===ROUTES.MARKETING_PROJECTS)await loadProjects()}

  function setLanguage(){
    ['marketingSocialFeedback','marketingContactFeedback','marketingProjectFeedback'].forEach(id=>{if($(id))$(id).textContent=''});
    ['marketingSocialStatus','marketingContactsStatus','marketingProjectsStatus'].forEach(id=>{if($(id))setStatus(id)});
    if(state.loaded.social)renderSocial();
    if(state.loaded.contacts)renderContacts();
    if(state.loaded.projects)renderProjects();
    syncSocialTabs();
    if($('marketingContactDetailDialog')?.open&&state.selectedContactId)showContactDetails(state.selectedContactId);
  }

  document.addEventListener('click',event=>{
    const route=event.target.closest('[data-marketing-route]')?.dataset.marketingRoute;if(route){navigateTo(route);return}
    const platform=event.target.closest('[data-platform]')?.dataset.platform;if(platform){state.platform=platform;syncSocialTabs();renderSocial();return}
    const socialType=event.target.closest('[data-social-type]')?.dataset.socialType;if(socialType){state.socialType=socialType;syncSocialTabs();renderSocial();return}
    const socialEdit=event.target.closest('[data-social-edit]')?.dataset.socialEdit;if(socialEdit){openSocialEditor(socialRecord(socialEdit));return}
    const socialDelete=event.target.closest('[data-social-delete]')?.dataset.socialDelete;if(socialDelete){deleteSocial(socialDelete);return}
    const contactDetails=event.target.closest('[data-contact-details]')?.dataset.contactDetails;if(contactDetails){showContactDetails(contactDetails);return}
    const contactEdit=event.target.closest('[data-contact-edit]')?.dataset.contactEdit;if(contactEdit){openContactEditor(contactRecord(contactEdit));return}
    const contactDelete=event.target.closest('[data-contact-delete]')?.dataset.contactDelete;if(contactDelete){deleteContact(contactDelete);return}
    const projectEdit=event.target.closest('[data-project-edit]')?.dataset.projectEdit;if(projectEdit){openProjectEditor(projectRecord(projectEdit));return}
    const projectDelete=event.target.closest('[data-project-delete]')?.dataset.projectDelete;if(projectDelete){deleteProject(projectDelete);return}
    if(event.target.closest('[data-marketing-dialog-close]'))closeDialog(event.target.closest('dialog'));
  });

  $('marketingSocialAdd')?.addEventListener('click',()=>openSocialEditor());
  $('marketingSocialForm')?.addEventListener('submit',saveSocial);
  $('marketingContactAdd')?.addEventListener('click',()=>openContactEditor());
  $('marketingContactForm')?.addEventListener('submit',saveContact);
  $('marketingContactDetailEdit')?.addEventListener('click',()=>openContactEditor(contactRecord(state.selectedContactId)));
  $('marketingContactSearch')?.addEventListener('input',event=>{state.contactQuery=event.target.value;renderContacts()});
  $('marketingContactStageFilter')?.addEventListener('change',event=>{state.contactStage=event.target.value;renderContacts()});
  $('marketingProjectAdd')?.addEventListener('click',()=>openProjectEditor());
  $('marketingProjectForm')?.addEventListener('submit',saveProject);
  $('marketingProjectFilters')?.addEventListener('click',event=>{const button=event.target.closest('[data-project-filter]');if(!button)return;state.projectFilter=button.dataset.projectFilter;document.querySelectorAll('[data-project-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderProjects()});
  $('divisionReturn')?.addEventListener('click',event=>{
    if(!String(currentRoute||'').startsWith('divisions/marketing/'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigateTo(ROUTES.MARKETING);
  },true);

  window.addEventListener('moscatelli:internal-user',()=>{state.loaded={social:false,contacts:false,projects:false};onRoute(currentRoute)});
  window.addEventListener('moscatelli:internal-sign-out',()=>{if(state.channel&&client())client().removeChannel(state.channel);state.channel=null;state.social=[];state.contacts=[];state.projects=[];state.loaded={social:false,contacts:false,projects:false}});

  window.MainHubMarketing={onRoute,setLanguage,reload:()=>onRoute(currentRoute)};
  queueMicrotask(()=>onRoute(typeof currentRoute==='string'?currentRoute:''));
})();
