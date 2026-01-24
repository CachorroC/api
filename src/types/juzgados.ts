export type id = string;

export type tipo = string;

export type ciudad = string;

export type JuzgadoGeneralType = `juzgado ${ id } ${ tipo } de ${ ciudad }`;

export type outGOINGJuzgado = Uppercase<JuzgadoGeneralType>;
