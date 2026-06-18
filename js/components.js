// ═══════════════════════════════════════════════
// Corradi Viajes — Shared Navigation Components
// ═══════════════════════════════════════════════

class AppNavbar extends HTMLElement {
  connectedCallback() {
    const currentPath = window.location.pathname;

    const links = [
      { id: 'nav-inicio',    href: 'index.html',           label: 'Inicio',          isIndex: true },
      { id: 'nav-grupales',  href: 'salidas-grupales.html', label: 'Salidas Grupales', match: 'salidas-grupales' },
      { id: 'nav-destinos',  href: 'busqueda.html',        label: 'Destinos',        match: 'busqueda' },
      { id: 'nav-ofertas',   href: 'ofertas.html',         label: 'Ofertas',         match: 'ofertas' },
      { id: 'nav-nosotros',  href: 'nosotros.html',        label: 'Nosotros',        match: 'nosotros' },
      { id: 'nav-contacto',  href: 'contacto.html',        label: 'Contacto',        match: 'contacto' },
    ];

    const mobileNavItems = [
      { href: 'index.html',            label: 'Inicio',           icon: 'home',           isIndex: true },
      { href: 'salidas-grupales.html', label: 'Salidas Grupales', icon: 'groups',          match: 'salidas-grupales' },
      { href: 'busqueda.html',         label: 'Destinos',         icon: 'travel_explore', match: 'busqueda' },
      { href: 'ofertas.html',          label: 'Ofertas',          icon: 'local_offer',    match: 'ofertas' },
      { href: 'nosotros.html',         label: 'Nosotros',         icon: 'flag',           match: 'nosotros' },
      { href: 'contacto.html',         label: 'Contacto',         icon: 'mail',           match: 'contacto' },
    ];

    const isHomePage = currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === '';

    const desktopLinks = links.map(l => {
      const isActive = l.isIndex ? isHomePage : currentPath.includes(l.match);
      const isGroup = l.id === 'nav-grupales';
      if (isGroup) {
        return `<a id="${l.id}" href="${l.href}" class="font-medium font-['Geomanist'] text-base inline-flex items-center gap-1.5 transition-all" style="color:${isActive ? '#ebb03a' : '#ebb03a'};text-shadow:0 0 12px rgba(235,176,58,0.25)">
          <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">groups</span>${l.label}
        </a>`;
      }
      return `<a id="${l.id}" href="${l.href}" class="${isActive
        ? "text-blue-400 font-medium font-['Geomanist'] text-base"
        : "text-white/70 font-medium font-['Geomanist'] text-base hover:text-white transition-colors"}">${l.label}</a>`;
    }).join('');

    const mobileItems = mobileNavItems.map(item => {
      const isActive = item.isIndex ? isHomePage : currentPath.includes(item.match);
      return `
        <a href="${item.href}" class="flex items-center gap-4 px-6 py-4 rounded-[14px] transition-all duration-150 ${isActive
          ? 'bg-white/10 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'} group">
          <div class="w-10 h-10 rounded-[10px] flex items-center justify-center ${isActive ? 'bg-blue-500/30' : 'bg-white/10 group-hover:bg-white/15'} transition-colors shrink-0">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' ${isActive ? '1' : '0'}">${item.icon}</span>
          </div>
          <span class="font-['Geomanist'] font-medium text-[15px]">${item.label}</span>
          <span class="material-symbols-outlined text-[18px] ml-auto opacity-30">chevron_right</span>
        </a>`;
    }).join('');

    this.innerHTML = `
      <header class="fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300">
        <div class="flex md:grid md:grid-cols-3 justify-between items-center w-[90%] max-w-[1800px] mx-auto py-5 md:py-4">

        <!-- Left: Logo -->
        <div class="flex items-center justify-start hover:opacity-80 transition-opacity cursor-pointer order-1" onclick="window.location.href='index.html'">
          <img src="img/logonavblanco.webp" alt="Corradi Viajes Logo" class="h-11 md:h-14 w-auto object-contain dark-logo block">
          <img src="img/logonavbnegro.webp" alt="Corradi Viajes Logo" class="h-11 md:h-14 w-auto object-contain light-logo hidden">
        </div>

        <!-- Center: Navigation Links -->
        <nav class="hidden md:flex items-center gap-8 justify-center order-2">${desktopLinks}</nav>

        <!-- Right: CTA Button & Mobile Menu -->
        <div class="relative flex items-center justify-end gap-3 order-3">
          <!-- Armá tu viaje button (desktop) -->
          <a href="contacto.html"
            class="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium font-['Geomanist'] text-sm px-5 py-2 rounded-full transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:scale-95 border border-blue-400/30">
            Armá tu viaje
          </a>

          <!-- Theme toggle button -->
          <button id="themeToggleBtn" onclick="event.stopPropagation();toggleTheme()" title="Cambiar tema">
            <span class="material-symbols-outlined" style="font-size:20px">light_mode</span>
          </button>

          <!-- Hamburger button (mobile) -->
          <button id="mobileMenuBtn" class="md:hidden flex items-center justify-center w-11 h-11 rounded-[12px] transition-colors active:scale-95" style="background:rgba(255,255,255,0.1)">
            <span id="mobileMenuIcon" class="material-symbols-outlined text-white text-[24px]">menu</span>
          </button>
        </div>
        </div>
      </header>

      <!-- Mobile Full-Width Dropdown Panel -->
      <div id="mobileDropdown"
        class="md:hidden fixed top-[73px] left-0 right-0 z-[99] backdrop-blur-3xl transform transition-all duration-300 origin-top hidden"
        style="background:#0d1b2e;box-shadow:0 20px 40px rgba(0,0,0,0.4);max-height:calc(100dvh - 73px);overflow-y:auto">
        <div class="p-4 flex flex-col gap-2">
          ${mobileItems}
        </div>
        <!-- WhatsApp CTA at bottom of menu -->
        <div class="px-4 pb-6 pt-2">
          <a href="https://wa.me/${typeof WHATSAPP_NUMBER !== 'undefined' ? WHATSAPP_NUMBER : '5493411234567'}?text=Hola%20Corradi%20Viajes%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20un%20viaje"
            target="_blank" rel="noopener"
            class="flex items-center justify-center gap-2 w-full hover:opacity-90 font-semibold font-['Geomanist'] text-sm px-4 py-3.5 rounded-[14px] transition-all shadow-[0_4px_14px_rgba(37,211,102,0.3)]"
            style="background:#25D366;color:#fff">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.556 4.122 1.528 5.855L.057 23.882a.75.75 0 0 0 .923.923l6.042-1.464A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.524-5.225-1.435l-.374-.223-3.878.94.965-3.87-.245-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    `;

    // Move dropdown to body so position:fixed works correctly outside the custom element
    const dropdownEl = this.querySelector('#mobileDropdown');
    if (dropdownEl) {
      document.body.appendChild(dropdownEl);
    }

    // Scroll effect for Navbar
    const header = this.querySelector('header');
    if (header) {
      const onScroll = () => {
        if (window.scrollY > 20) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll(); // initialize state
    }

    // Toggle mobile menu
    const btn = this.querySelector('#mobileMenuBtn');
    const dropdown = document.getElementById('mobileDropdown');
    const icon = this.querySelector('#mobileMenuIcon');

    if (btn && dropdown) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !dropdown.classList.contains('hidden');
        if (isOpen) {
          dropdown.classList.add('hidden');
          if (icon) icon.textContent = 'menu';
        } else {
          dropdown.classList.remove('hidden');
          if (icon) icon.textContent = 'close';
        }
      });

      document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !dropdown.contains(e.target) && !dropdown.classList.contains('hidden')) {
          dropdown.classList.add('hidden');
          if (icon) icon.textContent = 'menu';
        }
      });

      dropdown.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          dropdown.classList.add('hidden');
          if (icon) icon.textContent = 'menu';
        });
      });
    }
  }
}

class AppBottomNav extends HTMLElement {
  connectedCallback() {
    const currentPath = window.location.pathname;

    const items = [
      { href: 'busqueda.html', label: 'Destinos', icon: 'travel_explore', match: 'busqueda' },
      { href: 'ofertas.html', label: 'Ofertas', icon: 'local_offer', match: 'ofertas' },
      { href: 'nosotros.html', label: 'Nosotros', icon: 'groups', match: 'nosotros' },
      { href: 'contacto.html', label: 'Contacto', icon: 'mail', match: 'contacto' },
    ];

    this.innerHTML = ``;
  }
}

class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer style="background:#0a1525" class="w-full border-t border-white/10 px-8 py-12 flex flex-col items-center gap-4 text-center">
        <div class="mb-8">
          <img src="img/logonavblanco.webp" alt="Corradi Viajes Logo" class="h-28 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300 dark-logo block mx-auto">
          <img src="img/logonavbnegro.webp" alt="Corradi Viajes Logo" class="h-28 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300 light-logo hidden mx-auto">
        </div>
        <div class="flex gap-6 mb-4">
          <a class="font-['Geomanist'] text-sm text-white/50 hover:text-[#3778b8] transition-colors" href="nosotros.html">Nosotros</a>
          <a class="font-['Geomanist'] text-sm text-white/50 hover:text-[#3778b8] transition-colors" href="#">Términos</a>
          <a class="font-['Geomanist'] text-sm text-white/50 hover:text-[#3778b8] transition-colors" href="contacto.html">Contacto</a>
        </div>
        <p class="font-['Geomanist'] text-sm text-white/30">© 2026 Corradi Viajes. De Rosario al Mundo.</p>
      </footer>
    `;
  }
}

customElements.define('app-navbar', AppNavbar);
customElements.define('app-bottom-nav', AppBottomNav);
customElements.define('app-footer', AppFooter);
