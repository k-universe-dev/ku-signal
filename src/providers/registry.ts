import type { ModelProvider } from "../core/models.js";

type ProviderFactory = () => ModelProvider;

export class ProviderRegistry {
  private readonly factories = new Map<string, ProviderFactory>();

  register(name: string, factory: ProviderFactory): void {
    this.factories.set(name, factory);
  }

  resolve(name: string): ModelProvider {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(
        `Unknown provider: "${name}". Registered: ${this.list().join(", ")}`
      );
    }
    return factory();
  }

  hasProvider(name: string): boolean {
    return this.factories.has(name);
  }

  list(): string[] {
    return Array.from(this.factories.keys());
  }
}
