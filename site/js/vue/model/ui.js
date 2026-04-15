export const uiState = {
    rename : false,
    error : '',
    warning : '',
    modalError : '',
    modalErrorTarget : null,
    modalWarning : '',
    modalSuccess : '',
    loaded : false,
    touch : '',
    _showSigninPester : false,
    railCollapsed : false,
    // Rail flyout state
    railFlyout : null,       // 'calendar' | 'marker' | 'emoji' | null
    // Marker mode
    markerActive : false,
    markerColour : 1,
    // Emoji mode
    emojiActive : false,
    emojiSelected : '',
    // Modal flags (replace jQuery .modal('show')/.modal('hide') and Bootstrap data-toggle="modal")
    showAuthModal : false,
    authLinkMode : false,
    showShareModal : false,
    showEntryModal : false,
    showDeleteModal : false,
    showFeatureModal : false,
    // Rename form visibility (replace jQuery $('#rename').show()/hide())
    renameVisible : false,
    // Nav menu dropdown
    navMenuOpen : false,
    // Footer language dropdown
    showLangMenu : false,
    // Style theme crisp flag (for v-show on theme icons in rail)
    styleCrisp : false,
}
