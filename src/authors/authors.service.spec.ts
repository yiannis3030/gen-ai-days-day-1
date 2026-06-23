import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsRepository } from './authors.repository';
import { BooksRepository } from '../books/books.repository';
import { AuthorEntity } from './author.entity';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let authorsRepository: jest.Mocked<AuthorsRepository>;
  let booksRepository: jest.Mocked<BooksRepository>;

  const author: AuthorEntity = { id: 1, name: 'Robert C. Martin' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: AuthorsRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: BooksRepository,
          useValue: { findByAuthor: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get(AuthorsService);
    authorsRepository = module.get(AuthorsRepository);
    booksRepository = module.get(BooksRepository);
  });

  it('creates an author', async () => {
    authorsRepository.create.mockResolvedValue(author);
    await expect(service.create({ name: author.name })).resolves.toEqual(
      author,
    );
  });

  it('returns all authors', async () => {
    authorsRepository.findAll.mockResolvedValue([author]);
    await expect(service.findAll()).resolves.toEqual([{ ...author, books: [] }]);
  });

  it('finds author by id', async () => {
    authorsRepository.findById.mockResolvedValue(author);
    await expect(service.findOne(1)).resolves.toEqual({ ...author, books: [] });
  });

  it('throws when author not found', async () => {
    authorsRepository.findById.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns books for an author', async () => {
    authorsRepository.findById.mockResolvedValue(author);
    booksRepository.findByAuthor.mockResolvedValue([]);
    await expect(service.findBooks(1)).resolves.toEqual([]);
    expect(booksRepository.findByAuthor).toHaveBeenCalledWith(author.name);
  });

  it('throws when books requested for missing author', async () => {
    authorsRepository.findById.mockResolvedValue(null);
    await expect(service.findBooks(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
