/**
 * Analyzer-only declaration bridge.
 *
 * The rc.6 Typert generator recognizes decorators from an ambient module named
 * `@deepseek-ai/dsh-typert-protocol`, but its npm package ships as an external
 * module rather than that ambient shape. Host TypeScript resolves this file so
 * the analyzer can prove decorator identity. Emitted JavaScript keeps the bare
 * package specifier and tsdown resolves the real official runtime package.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertGatewayBindingOptions {
    readonly namespace?: string
  }

  abstract class TypertRemoteService<T = never> extends Service<T> {
    protected constructor(ctx: Context, serviceKey: string, options?: TypertGatewayBindingOptions)
  }

  type RemoteMethodDecorator = <This extends object, Args extends unknown[], Result>(
    method: (this: This, ...args: Args) => Result,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>,
  ) => void

  function Remote<This extends object, Args extends unknown[], Result>(
    method: (this: This, ...args: Args) => Result,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>,
  ): void
  function Remote(exportName: string): RemoteMethodDecorator
}

export {}
