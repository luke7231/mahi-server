export type Resolver<A, R, C> = (parent, args: A, context: C, info) => R;
