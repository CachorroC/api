import {  NotaProps, RelevantDateProps } from '../types/notas.js';
import { extractDatesFromText } from '../utils/extract-dates.js';

// 2. Define the Classes
export class RelevantDate {
  public readonly id?: number;
  public date        : Date;
  public text        : string;
  public notaId      : string | null;

  constructor(
    props: RelevantDateProps
  ) {
    this.id = props.id; // Will remain undefined until saved to DB
    this.date = props.date;
    this.text = props.text;
    this.notaId = props.notaId ?? null;
  }
}

export class NotasBuilder implements NotaProps {
  // Readonly for fields that shouldn't change after creation
  public readonly id       : string;
  public readonly createdAt: Date;
  public updatedAt         : Date;

  public carpetaNumero: number | null;
  public pathname     : string | null;
  public dueDate      : Date | null;
  public text         : string;
  public content      : string[];
  public completed    : boolean;
  public relevantDates: RelevantDate[];

  constructor(
    props: NotaProps, carpetaNumero?: number, index?: number
  ) {
    // --- Auto-generated / Default Fields Management ---
    // The nullish coalescing operator (??) ensures that if Prisma passes in a
    // date/id, we use it. If we are creating a new Note from scratch, we generate them.
    this.pathname = carpetaNumero
      ? `/Carpeta/${ carpetaNumero }`
      : null;
    this.id = `${ carpetaNumero
      ? carpetaNumero
      : Date.now() }-${
      index
        ? index
        : Math.random()
    }`;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.completed = props.completed ?? false;

    // --- Standard Fields ---
    this.carpetaNumero = props.carpetaNumero ?? null;
    this.dueDate = props.dueDate ?? null;
    this.text = props.text;
    this.content = props.content;

    // --- Relations ---
    // Map raw prop objects into instances of the RelevantDate class
    this.relevantDates = ( props.relevantDates ?? [] ).map(
      (
        rd
      ) => {
        return rd instanceof RelevantDate
          ? rd
          : new RelevantDate(
              {
                ...rd,
                notaId: this.id
              }
            );
      }
    );
  }

  // Example of how to manage updatedAt within the domain class
  public updateText(
    newText: string
  ): void {
    this.text = newText;
    this.markAsUpdated();
  }

  public toggleCompletion(): void {
    this.completed = !this.completed;
    this.markAsUpdated();
  }

  private markAsUpdated(): void {
    this.updatedAt = new Date();
  }
  public static fromString(
    incomingNote: string, carpetaNumero?: number, index?: number
  ) {


    const trimmedNote = incomingNote.trim();
    const allDates = extractDatesFromText(
      trimmedNote
    );

    return new NotasBuilder(
      {

        text   : trimmedNote,
        dueDate: allDates.length > 0
          ? allDates[ 0 ].date
          : undefined,
        relevantDates: allDates.length >= 1
          ? allDates
          : [],
        content: trimmedNote.split(
          '//'
        ),
        pathname: carpetaNumero
          ? `/Carpeta/${ carpetaNumero }`
          : null,
        id: `${ carpetaNumero
          ? carpetaNumero
          : Date.now() }-${
          index
            ? index
            : Math.random()
        }`,
        carpetaNumero
      }, carpetaNumero, index
    );
  }
}
/*
export class NotasBuilder implements IntNota {
  readonly createdAt: Date;
  pathname          : string | null;
  dueDate           : Date | null;
  text              : string;
  content           : string[] = [];
  id                : string;
  constructor(
    incomingNote: string, carpetaNumero?: number, index?: number
  ) {
    this.content = incomingNote.split(
      '//'
    );

    const dateExtract = datesExtractor(
      incomingNote
    );

    if ( dateExtract.length === 0 ) {
      this.dueDate = null;
    }

    const [
      firstDate
    ] = dateExtract;

    this.dueDate = firstDate;
    this.text = incomingNote;
    this.createdAt = new Date();
    this.pathname = carpetaNumero
      ? `/Carpeta/${ carpetaNumero }`
      : null;
    this.id = `${ carpetaNumero
      ? carpetaNumero
      : Date.now() }-${
      index
        ? index
        : Math.random()
    }`;
  }
}
 */