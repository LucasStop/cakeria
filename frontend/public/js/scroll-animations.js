function initScrollAnimations() {
  console.log('Inicializando animações de scroll');

  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  const isElementInViewport = el => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
      rect.bottom >= 0
    );
  };

  const animateElements = () => {
    animatedElements.forEach(element => {
      if (isElementInViewport(element)) {
        element.classList.add('animated');
      }
    });
  };

  animateElements();

  window.addEventListener('scroll', animateElements);

  return {
    destroy: function () {
      window.removeEventListener('scroll', animateElements);
    },
  };
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initScrollAnimations, 1);
} else {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
}
