// Global button state manager using browser events
class ButtonStateManager {
  private static instance: ButtonStateManager
  private completedActions: Set<string> = new Set()
  private isInitialized = false

  static getInstance(): ButtonStateManager {
    if (!ButtonStateManager.instance) {
      ButtonStateManager.instance = new ButtonStateManager()
    }
    return ButtonStateManager.instance
  }

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Load from localStorage
    this.loadFromStorage()

    // Listen for custom events
    if (typeof window !== 'undefined') {
      window.addEventListener('product-action-completed', this.handleActionCompleted.bind(this))
      window.addEventListener('product-action-check', this.handleActionCheck.bind(this))
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('completedProductActions')
        if (saved) {
          this.completedActions = new Set(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading product actions:', error)
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('completedProductActions', JSON.stringify([...this.completedActions]))
    }
  }

  private handleActionCompleted = (event: CustomEvent) => {
    const { productKey } = event.detail
    this.completedActions.add(productKey)
    this.saveToStorage()
    
    // Dispatch a state change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-state-changed', {
        detail: { completedActions: [...this.completedActions] }
      }))
    }
  }

  private handleActionCheck = (event: CustomEvent) => {
    const { productKey, callback } = event.detail
    const isCompleted = this.completedActions.has(productKey)
    if (callback) {
      callback(isCompleted)
    }
  }

  addAction(productKey: string) {
    this.completedActions.add(productKey)
    this.saveToStorage()
    
    // Dispatch state change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-state-changed', {
        detail: { completedActions: [...this.completedActions] }
      }))
    }
  }

  hasAction(productKey: string): boolean {
    return this.completedActions.has(productKey)
  }

  getAllActions(): string[] {
    return [...this.completedActions]
  }
}

// Initialize the manager immediately
if (typeof window !== 'undefined') {
  ButtonStateManager.getInstance()
}

export { ButtonStateManager }
