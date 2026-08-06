import { beforeEach, describe, expect, it } from 'vitest'
import type { DatabaseAdapter } from './adapter'
import {
  deleteEbook,
  getAllEbooks,
  getEbookById,
  saveEbook,
  updateEbookProgress,
} from './repositories/ebooks'
import { migrate } from './migrations'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

describe('ebooks repository', () => {
  let db: DatabaseAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  it('saves and lists ebooks ordered by lastReadAt DESC', async () => {
    const book1 = {
      id: 'book-1',
      title: 'Der Steppenwolf',
      author: 'Hermann Hesse',
      filePath: '/books/steppenwolf.epub',
      progressPercent: 10,
      createdAt: 1000,
      lastReadAt: 1000,
    }
    const book2 = {
      id: 'book-2',
      title: 'Die Verwandlung',
      author: 'Franz Kafka',
      filePath: '/books/verwandlung.epub',
      progressPercent: 45,
      createdAt: 2000,
      lastReadAt: 2000,
    }

    await saveEbook(db, book1)
    await saveEbook(db, book2)

    const list = await getAllEbooks(db)
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe('book-2')
    expect(list[1].id).toBe('book-1')

    const found = await getEbookById(db, 'book-1')
    expect(found?.title).toBe('Der Steppenwolf')
  })

  it('updates reading progress and lastReadAt', async () => {
    const book = {
      id: 'book-3',
      title: 'Faust',
      author: 'Goethe',
      filePath: '/books/faust.epub',
      progressPercent: 0,
      createdAt: 1000,
      lastReadAt: 1000,
    }
    await saveEbook(db, book)

    await updateEbookProgress(db, 'book-3', 'epubcfi(/6/4[chapter1]!/4/2)', 25)

    const updated = await getEbookById(db, 'book-3')
    expect(updated?.currentCfi).toBe('epubcfi(/6/4[chapter1]!/4/2)')
    expect(updated?.progressPercent).toBe(25)
    expect(updated?.lastReadAt).toBeGreaterThan(1000)
  })

  it('deletes an ebook from library', async () => {
    const book = {
      id: 'book-4',
      title: 'Siddhartha',
      filePath: '/books/siddhartha.epub',
      progressPercent: 0,
      createdAt: 1000,
      lastReadAt: 1000,
    }
    await saveEbook(db, book)
    await deleteEbook(db, 'book-4')

    const found = await getEbookById(db, 'book-4')
    expect(found).toBeNull()
  })
})
