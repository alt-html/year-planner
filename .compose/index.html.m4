m4_changequote(`[[[', `]]]')m4_dnl
<!doctype html>
<html lang="en" xmlns:v-on="http://www.w3.org/1999/xhtml" xmlns:v-bind="http://www.w3.org/1999/xhtml">
m4_include([[[.compose/fragments/head.html]]])m4_dnl
<body>
    <div id="app" v-bind:class="{'yp-dark':theme=='dark'}" v-bind:data-bs-theme="theme=='dark' ? 'dark' : null" v-on:click="showLangMenu = false">
m4_include([[[.compose/fragments/rail.html]]])m4_dnl

m4_include([[[.compose/fragments/spinner.html]]])
m4_include([[[.compose/fragments/nav.html]]])
m4_include([[[.compose/fragments/grid.html]]])
m4_include([[[.compose/fragments/modals.html]]])
m4_include([[[.compose/fragments/footer.html]]])m4_dnl
    </div>



m4_include([[[.compose/fragments/scripts.html]]])m4_dnl

</body>
</html>
