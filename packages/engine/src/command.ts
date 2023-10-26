import { Annotation, methodDecorator } from "@tashmet/core";
import { Document, TashmetNamespace } from "@tashmet/tashmet";

export class CommandAnnotation extends Annotation {
  public constructor(
    public readonly name: string,
    public readonly propertyKey: string
  ) { super(); }
}

export const command = (name: string) =>
  methodDecorator<CommandHandler>(({propertyKey}) => new CommandAnnotation(name, propertyKey));

export type CommandHandler = (ns: TashmetNamespace, command: Document) => Promise<Document>;


export class CommandRunner {
  private commandNames = new Set<string>();

  public static fromControllers(...controllers: any[]) {
    const commands: Record<string, CommandHandler> = {};

    for (const c of controllers) {
      for (const anno of CommandAnnotation.onClass(c.constructor, true)) {
        commands[anno.name] = (ns, cmd) => c[anno.propertyKey](ns, cmd);
      }
    }
    return new CommandRunner(commands);
  }

  public constructor(
    private commands: Record<string, CommandHandler> = {}
  ) {
    this.commandNames = new Set(Object.keys(commands));
  }

  public command(ns: TashmetNamespace, command: Document): Promise<Document> {
    const op = CommandRunner.operation(command);
    if (!this.commandNames.has(op)) {
      throw new Error(`Command ${op} is not supported`);
    }
    return this.commands[`${op}`](ns, command);
  }

  public static operation(command: Document): string {
    return Object.keys(command)[0];
  }
}
