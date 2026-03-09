
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/microservices']
    },
    {
      type: 'category',
      label: 'Backend',
      items: ['backend/spring-boot']
    },
    {
      type: 'category',
      label: 'Kafka',
      items: ['kafka/saga-pattern']
    }
  ]
}

export default sidebars
