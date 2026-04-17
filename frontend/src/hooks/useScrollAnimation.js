import { useEffect, useRef } from 'react'

export default function useScrollAnimation(options = {}) {
  const ref = useRef(null)
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    callback = null,
    animateChildren = true,
    staggerDelay = 100,
  } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Animate parent section
        element.style.transition = 'all 1s ease-out'
        element.style.opacity = '1'
        element.style.transform = 'translateY(0)'
        element.classList.add('is-visible')
        
        // Animate child cards with stagger
        if (animateChildren) {
          const children = element.querySelectorAll('[class*="opacity-0"]')
          children.forEach((child, index) => {
            setTimeout(() => {
              child.style.transition = 'all 0.7s ease-out'
              child.style.opacity = '1'
              child.style.transform = 'translateY(0)'
            }, index * staggerDelay)
          })
        }
        
        if (callback) callback()
        observer.unobserve(element)
      }
    }, {
      threshold,
      rootMargin,
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, callback, animateChildren, staggerDelay])

  return ref
}
