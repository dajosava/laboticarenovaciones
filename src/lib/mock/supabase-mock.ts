import { MOCK_USER, mockTables } from './data'

// ─── Mock Query Builder ─────────────────────────
// Simula el API de consultas encadenadas de Supabase
class MockQueryBuilder {
  private _data: any[]

  constructor(data: any[]) {
    this._data = [...data]
  }

  select(_columns?: string): this {
    return this
  }

  eq(field: string, value: any): this {
    this._data = this._data.filter((item: any) => item[field] === value)
    return this
  }

  neq(field: string, value: any): this {
    this._data = this._data.filter((item: any) => item[field] !== value)
    return this
  }

  lte(field: string, value: any): this {
    this._data = this._data.filter((item: any) => item[field] <= value)
    return this
  }

  gte(field: string, value: any): this {
    this._data = this._data.filter((item: any) => item[field] >= value)
    return this
  }

  in(field: string, values: any[]): this {
    this._data = this._data.filter((item: any) => values.includes(item[field]))
    return this
  }

  order(field: string, options?: { ascending?: boolean }): this {
    const asc = options?.ascending ?? true
    this._data.sort((a: any, b: any) => {
      if (a[field] < b[field]) return asc ? -1 : 1
      if (a[field] > b[field]) return asc ? 1 : -1
      return 0
    })
    return this
  }

  limit(n: number): this {
    this._data = this._data.slice(0, n)
    return this
  }

  single() {
    const result = { data: this._data[0] || null, error: null }
    return makeThenableResult(result)
  }

  then(onfulfilled?: any, onrejected?: any): Promise<any> {
    return Promise.resolve({ data: this._data, error: null }).then(onfulfilled, onrejected)
  }
}

// ─── Mock Insert Builder ────────────────────────
class MockInsertBuilder {
  private _insertedData: any

  constructor(data: any, tableData: any[]) {
    const id = 'new-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
    this._insertedData = { id, ...data, creado_en: new Date().toISOString() }
    tableData.push(this._insertedData)
  }

  select(_columns?: string): this {
    return this
  }

  single() {
    const result = { data: this._insertedData, error: null }
    return makeThenableResult(result)
  }

  then(onfulfilled?: any, onrejected?: any): Promise<any> {
    return Promise.resolve({ data: this._insertedData, error: null }).then(onfulfilled, onrejected)
  }
}

function makeThenableResult(result: { data: any; error: any }) {
  return {
    then(onfulfilled?: any, onrejected?: any) {
      return Promise.resolve(result).then(onfulfilled, onrejected)
    },
  }
}

// ─── Mock Auth ──────────────────────────────────
const mockAuth = {
  getUser() {
    return Promise.resolve({
      data: { user: MOCK_USER },
      error: null,
    })
  },

  signInWithPassword(_credentials: { email: string; password: string }) {
    return Promise.resolve({ data: { user: MOCK_USER, session: {} }, error: null })
  },

  resetPasswordForEmail(_email: string, _options?: { redirectTo?: string }) {
    return Promise.resolve({ data: {}, error: null })
  },

  exchangeCodeForSession(_code: string) {
    return Promise.resolve({ data: { session: {}, user: MOCK_USER }, error: null })
  },

  signOut() {
    return Promise.resolve({ error: null })
  },

  onAuthStateChange(_callback: any) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
}

// ─── Mock Supabase Client ───────────────────────
export function createMockClient() {
  return {
    auth: mockAuth,

    from(table: string) {
      const tableData = mockTables[table] || []

      return {
        select(columns?: string) {
          return new MockQueryBuilder(tableData).select(columns)
        },

        insert(data: any) {
          return new MockInsertBuilder(data, tableData)
        },

        update(data: any) {
          return {
            eq(field: string, value: any) {
              const item = tableData.find((row: any) => row[field] === value)
              if (item) Object.assign(item, data)
              return makeThenableResult({ data: item || null, error: null })
            },
            then(onfulfilled?: any, onrejected?: any) {
              return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected)
            },
          }
        },

        delete() {
          return {
            eq(field: string, value: any) {
              const idx = tableData.findIndex((row: any) => row[field] === value)
              const deleted = idx >= 0 ? tableData.splice(idx, 1)[0] : null
              return makeThenableResult({ data: deleted, error: null })
            },
            then(onfulfilled?: any, onrejected?: any) {
              return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected)
            },
          }
        },
      }
    },
  }
}
