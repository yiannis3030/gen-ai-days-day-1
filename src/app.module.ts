import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from './books/book.entity';
import { AuthorEntity } from './authors/author.entity';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      // In-memory database: pass an empty buffer; sql.js requires no native bindings.
      database: new Uint8Array(),
      location: ':memory:',
      autoSave: false,
      dropSchema: true,
      synchronize: true,
      entities: [BookEntity, AuthorEntity],
    }),
    BooksModule,
    AuthorsModule,
  ],
})
export class AppModule {}

