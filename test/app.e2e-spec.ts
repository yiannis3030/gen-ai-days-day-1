import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Book Library API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const bookPayload = {
    title: 'Clean Code',
    authors: ['Robert C. Martin'],
    isbn: '978-0132350884',
    publishedYear: 2008,
    genre: 'Software',
  };

  it('runs the full book lifecycle', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/books')
      .send(bookPayload)
      .expect(201);
    const id = created.body.id;

    await request(app.getHttpServer()).get(`/api/books/${id}`).expect(200);

    await request(app.getHttpServer())
      .get('/api/books')
      .query({ genre: 'Software', author: 'Robert C. Martin' })
      .expect(200)
      .expect((res) => expect(res.body.length).toBe(1));

    await request(app.getHttpServer())
      .put(`/api/books/${id}`)
      .send({ ...bookPayload, title: 'Clean Code 2' })
      .expect(200)
      .expect((res) => expect(res.body.title).toBe('Clean Code 2'));

    await request(app.getHttpServer()).delete(`/api/books/${id}`).expect(204);
    await request(app.getHttpServer()).get(`/api/books/${id}`).expect(404);
  });

  it('returns 409 for duplicate isbn', async () => {
    const payload = { ...bookPayload, isbn: 'dup-isbn-1' };
    await request(app.getHttpServer())
      .post('/api/books')
      .send(payload)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/books')
      .send(payload)
      .expect(409);
  });

  it('returns 400 for validation failure', async () => {
    await request(app.getHttpServer())
      .post('/api/books')
      .send({ authors: ['No title'] })
      .expect(400);
  });

  it('handles author create, get and books lookup', async () => {
    const author = await request(app.getHttpServer())
      .post('/api/authors')
      .send({ name: 'Martin Fowler', nationality: 'British' })
      .expect(201);
    const id = author.body.id;

    await request(app.getHttpServer()).get(`/api/authors/${id}`).expect(200);

    await request(app.getHttpServer())
      .post('/api/books')
      .send({
        title: 'Refactoring',
        authors: ['Martin Fowler'],
        isbn: 'isbn-fowler-1',
        publishedYear: 1999,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/authors/${id}/books`)
      .expect(200)
      .expect((res) => expect(res.body.length).toBe(1));

    await request(app.getHttpServer()).get('/api/authors/9999').expect(404);
    await request(app.getHttpServer())
      .get('/api/authors/9999/books')
      .expect(404);
  });

  it('GET /api/authors returns 200 and an array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/authors')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/books/:id returns 409 for duplicate ISBN on update', async () => {
    const bookA = await request(app.getHttpServer())
      .post('/api/books')
      .send({ ...bookPayload, isbn: 'update-dup-isbn-a' })
      .expect(201);
    const bookB = await request(app.getHttpServer())
      .post('/api/books')
      .send({ ...bookPayload, isbn: 'update-dup-isbn-b' })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/api/books/${bookB.body.id}`)
      .send({ ...bookPayload, isbn: 'update-dup-isbn-a' })
      .expect(409);
  });

  it('PUT /api/books/:id returns 404 when book does not exist', async () => {
    await request(app.getHttpServer())
      .put('/api/books/999999')
      .send({ ...bookPayload, isbn: 'put-nonexistent-isbn' })
      .expect(404);
  });

  it('DELETE /api/books/:id returns 404 when book does not exist', async () => {
    await request(app.getHttpServer())
      .delete('/api/books/999999')
      .expect(404);
  });

  it('POST /api/authors returns 400 when name is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/authors')
      .send({ nationality: 'British' })
      .expect(400);
  });

  it('error response shape contains error, message and status fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/books/999999')
      .expect(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('status');
  });
});

