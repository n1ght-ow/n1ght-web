/* Liminal opening: the engine owns motion state; this file mirrors it. */
(() => {
  'use strict';

  const hero = document.getElementById('hero');
  const light = window.LiminalLight;
  if (!hero || !hero.classList.contains('liminal-hero') || !light) return;

  const title = hero.querySelector('.hero-wordmark');
  const stage = hero.querySelector('.liminal-hero__stage');
  const description = hero.querySelector('.liminal-hero__description');
  const enter = hero.querySelector('.liminal-enter');
  const bottom = hero.querySelector('.liminal-hero__bottom');
  const prints = Array.from(hero.querySelectorAll('.liminal-hero__prints [data-cover-frame]'));
  const titleLines = Array.from(hero.querySelectorAll('.hero-wordmark .liminal-word > span'));
  const toggles = Array.from(document.querySelectorAll('[data-motion-toggle]'));

  let motionPaused = false;
  let intro = null;
  let parallax = [];

  if (title && !title.hasAttribute('aria-label')) title.setAttribute('aria-label', 'N1GHT CHXN9');

  prints.forEach((button) => {
    button.addEventListener('click', () => {
      const frame = Number(button.dataset.coverFrame);
      if (Number.isFinite(frame) && typeof openDetail === 'function') {
        openDetail('photo', frame, button);
      }
    });
  });

  const applyMotionState = () => {
    if (!intro) return;
    if (motionPaused) {
      intro.progress(1).pause();
      parallax.forEach(({ tween, trigger }) => {
        tween.pause();
        trigger.disable(false);
      });
      return;
    }
    parallax.forEach(({ tween, trigger }) => {
      trigger.enable();
      tween.resume();
    });
  };

  const syncControls = (state) => {
    if (!state) return;
    motionPaused = Boolean(state.paused);
    const reduced = Boolean(state.reduced);
    hero.dataset.motionState = reduced ? 'reduced' : motionPaused ? 'paused' : 'running';
    toggles.forEach((button) => {
      const label = button.querySelector('span');
      const text = reduced ? 'Motion reduced' : motionPaused ? 'Resume motion' : 'Pause motion';
      button.disabled = reduced;
      button.setAttribute('aria-pressed', String(motionPaused));
      button.setAttribute('aria-label', text);
      if (label) label.textContent = text;
    });
    applyMotionState();
  };

  const toggleMotion = () => {
    light.toggle();
  };

  toggles.forEach((button) => button.addEventListener('click', toggleMotion));

  const onEngineState = (event) => {
    syncControls(event.detail);
  };
  window.addEventListener('liminal:motion-state', onEngineState);

  const initMotion = () => {
    syncControls(light.getState());
    if (!window.gsap) return;

    const motionMedia = window.gsap.matchMedia();
    motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
      const gsap = window.gsap;
      const revealTargets = [description, enter, bottom].filter(Boolean);
      const printTargets = prints;
      const titleTargets = titleLines.length ? titleLines : (title ? [title] : []);
      const currentIntro = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          gsap.set([...revealTargets, ...titleTargets, ...printTargets].filter(Boolean), {
            clearProps: 'transform,opacity,visibility'
          });
          if (stage) gsap.set(stage, { clearProps: 'opacity,visibility' });
        }
      });
      intro = currentIntro;
      parallax = [];

      if (stage) {
        currentIntro.fromTo(stage, {
          scale: 0.965,
          autoAlpha: 0.84
        }, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.92
        }, 0);
      }

      if (titleTargets.length) {
        currentIntro.fromTo(titleTargets, {
          yPercent: 112,
          autoAlpha: 0
        }, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.78,
          stagger: 0.1
        }, 0.04);
      }

      if (description || enter) {
        currentIntro.fromTo([description, enter].filter(Boolean), {
          y: 14,
          autoAlpha: 0
        }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.52,
          stagger: 0.06
        }, 0.34);
      }

      if (bottom) {
        currentIntro.fromTo(bottom, {
          y: 12,
          autoAlpha: 0
        }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.42
        }, 0.48);
      }

      if (printTargets.length) {
        currentIntro.fromTo(printTargets, {
          y: 18,
          autoAlpha: 0
        }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.46,
          stagger: 0.07
        }, 0.5);
      }

      const addParallax = (tween) => {
        if (tween?.scrollTrigger) parallax.push({ tween, trigger: tween.scrollTrigger });
      };

      if (window.ScrollTrigger) {
        gsap.registerPlugin(window.ScrollTrigger);
        if (title) {
          addParallax(gsap.to(title, {
            yPercent: -3.5,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.65,
              invalidateOnRefresh: true
            }
          }));
        }
        if (stage) {
          addParallax(gsap.fromTo(stage, {
            yPercent: 0
          }, {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8,
              invalidateOnRefresh: true
            }
          }));
        }
      }

      applyMotionState();

      return () => {
        currentIntro.kill();
        parallax.forEach(({ tween, trigger }) => {
          trigger.kill();
          tween.kill();
        });
        if (intro === currentIntro) intro = null;
        parallax = [];
        gsap.set([...revealTargets, ...titleTargets, ...printTargets, stage].filter(Boolean), {
          clearProps: 'transform,opacity,visibility'
        });
      };
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotion, { once: true });
  } else {
    initMotion();
  }
})();
