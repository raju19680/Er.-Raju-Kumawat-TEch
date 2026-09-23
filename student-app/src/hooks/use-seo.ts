import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  schema?: Record<string, any>
}

export function useSEO({ title, description, image, url, schema }: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = `${title} | Er. Raju Kumawat Tech`
    }

    // 2. Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', description)
    }

    // 3. Update Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
    ]

    ogTags.forEach(({ property, content }) => {
      if (content) {
        let metaTag = document.querySelector(`meta[property="${property}"]`)
        if (!metaTag) {
          metaTag = document.createElement('meta')
          metaTag.setAttribute('property', property)
          document.head.appendChild(metaTag)
        }
        metaTag.setAttribute('content', content)
      }
    })

    // 4. Inject JSON-LD Schema
    let scriptTag = document.querySelector('script#seo-schema') as HTMLScriptElement
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.id = 'seo-schema'
        scriptTag.type = 'application/ld+json'
        document.head.appendChild(scriptTag)
      }
      scriptTag.textContent = JSON.stringify(schema)
    } else if (scriptTag) {
      scriptTag.remove()
    }

    return () => {
      if (title) document.title = 'Er. Raju Kumawat Tech - Education Platform'
    }
  }, [title, description, image, url, schema])
}
