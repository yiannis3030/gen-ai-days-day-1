import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksRepository } from './books.repository';
import { BookEntity } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';

describe('BooksService', () => {
  let service: BooksService;
  let repository: jest.Mocked<BooksRepository>;

  const book: BookEntity = {
    id: 1,
    title: 'Clean Code',
    authors: ['Robert C. Martin'],
    isbn: '978-0132350884',
    publishedYear: 2008,
    genre: 'Software',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: BooksRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIsbn: jest.fn(),
            findByAuthor: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BooksService);
    repository = module.get(BooksRepository);
  });

  it('creates a book', async () => {
    const dto: CreateBookDto = {
      title: book.title,
      authors: book.authors,
      isbn: book.isbn,
      publishedYear: book.publishedYear,
      genre: book.genre,
    };
    repository.findByIsbn.mockResolvedValue(null);
    repository.create.mockResolvedValue(book);

    await expect(service.create(dto)).resolves.toEqual(book);
    expect(repository.create).toHaveBeenCalled();
  });

  it('rejects duplicate isbn on create', async () => {
    repository.findByIsbn.mockResolvedValue(book);
    await expect(
      service.create({ ...book } as CreateBookDto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns all books with filters', async () => {
    repository.findAll.mockResolvedValue([book]);
    await expect(service.findAll({ genre: 'Software' })).resolves.toEqual([
      book,
    ]);
    expect(repository.findAll).toHaveBeenCalledWith({ genre: 'Software' });
  });

  it('finds a book by id', async () => {
    repository.findById.mockResolvedValue(book);
    await expect(service.findOne(1)).resolves.toEqual(book);
  });

  it('throws when book not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an existing book', async () => {
    repository.findById.mockResolvedValue({ ...book });
    repository.findByIsbn.mockResolvedValue(null);
    repository.save.mockImplementation(async (e) => e);

    const result = await service.update(1, {
      ...book,
      title: 'Updated',
    } as CreateBookDto);
    expect(result.title).toBe('Updated');
  });

  it('throws when updating a missing book', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      service.update(99, { ...book } as CreateBookDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an existing book', async () => {
    repository.findById.mockResolvedValue(book);
    repository.remove.mockResolvedValue();
    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(book);
  });

  it('throws when deleting a missing book', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});

