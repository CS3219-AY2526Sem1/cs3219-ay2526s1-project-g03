const greeting = 'world';

function hello(world: string = greeting): string {
  return `Hello ${world}!`;
}

export default hello;
