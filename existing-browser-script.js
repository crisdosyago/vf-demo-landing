
  {
    const DELAY_SAY_WAIT = 300;
    const MobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const BROWSERS = [
      `https://demo-vfp-us-iowa.dosyago.com:8002/login?token=bhvNDh6XYZ&ran=${Math.random()}`,
      `https://demo-vfp-us-n-virginia.dosyago.com:8002/login?token=bhvNDh6XYZ&ran=${Math.random()}`,
      `https://demo-vfp-sg.dosyago.com:8002/login?token=bhvNDh6XYZ&ran=${Math.random()}`,
    ];
    const loadingUrl = `/loading.html`;
    let frame = document?.documentElement?.querySelector('iframe.remote-browser-portal');
    let locked = false;
    let locking = false;

    self.loadBrowser = loadBrowser;

    installCopySharingLink(document);

    async function loadBrowser(event) {
      event.preventDefault();
      frame = document?.documentElement?.querySelector('iframe.remote-browser-portal');
      if ( ! frame ) {
        await delaySay(`Oh no! The iframe that's supposed to be in the page is not present. 😱`);
        return;
      }
      frame.setAttribute('src', loadingUrl);

      event.target.querySelector('button').disabled = true;

      const Fastest = [];
      let failed = true;

      installScrollLock(frame);

      for( const url of BROWSERS ) {
        // Notes
          // source:  StackOverflow answer
          // https://stackoverflow.com/a/66865354
          let duration = Infinity;
          const resourceObserver = new PerformanceObserver( (list) => {
            list.getEntries()
              // get only the one we're interested in
              .filter( ({ name }) => name === url )
              .forEach( (resource) => {
                ({duration}) = resource;
              });
            // Disconnect after processing the events.
            resourceObserver.disconnect();
          } );
          // make it a resource observer
          resourceObserver.observe( { type: "resource" } );
        const resp = await fetch(url, {mode: 'no-cors'});
        if ( resp.error || ! resp.ok ) {
          failed = failed && true;
          const message = `Health check failed for 
            Browser (${url})
            with (${resp.status}: ${resp.statusText}): ${resp.error || 'error'}
          `;
          console.warn(message);
        }
        Fastest.push({url, duration});
      }

      if ( !failed ) {
        const fastest = Fastest.sort(
          ({duration:a},{duration:b}) => a-b
        )[0];
        const {url:loginUrl} = fastest;
        console.log(Fastest, loginUrl);
        frame.setAttribute('src', loginUrl);
        frame.classList.add('active');
        setTimeout(() => {
            frame.scrollIntoView();
          },
          200
        );
      } else {
        delaySay(`Sorry no browsers are available right now.`);
        setTimeout(() => {
            event.target.querySelector('button').disabled = false;
          },
          500
        );
      }

      return false;
    }

    function installCopySharingLink(doc) {
      const target = doc.documentElement || doc.body;
      console.log(target);
      target.addEventListener('dblclick', copyShareLink);
      target.addEventListener('contextmenu', copyShareLink);
    }

    async function copyShareLink(e) {
      console.log(e);
      const frameSrc = frame.src;
      if ( ! frameSrc ) {
        await delaySay(`Sorry, you haven't started a session yet. Click the 'Try right now' button, to start a browser session. Then you can double-tap or long-hold anywhere on the top of the page to share it!`);
        return;
      }
      let shareWorked = false;
      try {
        const shareResult = await navigator.share({
          title: 'Viewfinder Co-browsing session',
          text: 'I invite you to join my co-browsing session.',
          url: frameSrc
        });
        shareWorked = true;
      } catch(e) {
        await delaySay(`Oops, we couldn't share that link to another app. But let's try to copy it to the clipboard.`);
      }
      if ( shareWorked ) return;

      let copyWorked = false;
      try {
        const copyResult = await navigator.clipboard.writeText(frameSrc); 
        copyWorked = true;
      } catch(e) {
        await delaySay(`Sorry, copy to clipboard didn't work. But here's the cobrowsing sharing link: ${frameSrc}`);
      }
      if ( copyWorked ) {
        await delaySay(`Success! The cobrowsing share link was copied to your clipboard. Send it to someone to invite them onto your session.`);
      }
      return;
    }

    async function delaySay(msg) {
      let resolve;
      const pr = new Promise(res => resolve = res);
      setTimeout(() => resolve(alert(`\n  ${msg}\n`)), DELAY_SAY_WAIT);
      return pr;
    }

    function installScrollLock(target) {
      target.addEventListener('pointerenter', lockScroll);
      target.addEventListener('pointerleave', unlockScroll);
    }

    function lockScroll() {
      locked = true;
      locking = setTimeout(() => {
        document.documentElement.style.overflow = 'hidden';
        console.log('locked', locked);
      }, 600);
    }

    function unlockScroll() {
      locked = false;
      clearTimeout(locking);
      locking = false;
      document.documentElement.style.overflow = 'auto';
      console.log('locked', locked);
    }

    function isMobile() {
      return MobilePlatform.test(navigator.userAgent);
    }
  }