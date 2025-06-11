export const apiDocs = {
    openapi: '3.0.0',
    info: {
      title: 'Financial Management API',
      version: '1.0.0',
      description: 'API untuk manajemen keuangan, transaksi, dan laporan',
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan token JWT yang didapat setelah login'
        }
      },
      schemas: {
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID unik pengguna' },
            email: { type: 'string', format: 'email', description: 'Alamat email pengguna' },
            name: { type: 'string', nullable: true, description: 'Nama pengguna (opsional)' },
            businessName: { type: 'string', nullable: true, description: 'Nama Bisnis' },
            businessOwner: { type: 'string', nullable: true, description: 'Nama Pemilik Bisnis' },
            phoneNumber: { type: 'string', nullable: true, description: 'Nomor Kontak' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Pesan error' },
            status: { type: 'string', enum: ['error'], description: 'Status response' },
            code: { type: 'integer', description: 'HTTP status code' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoint untuk autentikasi dan manajemen profil'
      },
      {
        name: 'Transactions',
        description: 'Endpoint untuk manajemen transaksi'
      },
      {
        name: 'Categories',
        description: 'Endpoint untuk manajemen kategori'
      },
      {
        name: 'Reports',
        description: 'Endpoint untuk laporan keuangan'
      }
    ],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrasi pengguna baru',
          description: 'Mendaftarkan pengguna baru dengan informasi bisnis opsional',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { 
                      type: 'string', 
                      format: 'email', 
                      example: 'budi.santoso@email.com',
                      description: 'Alamat email untuk login'
                    },
                    password: { 
                      type: 'string', 
                      minLength: 6, 
                      example: '123456',
                      description: 'Password minimal 6 karakter'
                    },
                    name: { 
                      type: 'string', 
                      example: null, 
                      nullable: true, 
                      description: 'Nama pengguna (opsional)' 
                    },
                    businessName: { 
                      type: 'string', 
                      example: 'Budi Santoso', 
                      nullable: true, 
                      description: 'Nama Bisnis (opsional)' 
                    },
                    businessOwner: { 
                      type: 'string', 
                      example: 'Budi Santoso', 
                      nullable: true, 
                      description: 'Nama Pemilik Bisnis (opsional)' 
                    },
                    phoneNumber: { 
                      type: 'string', 
                      example: '+628123456789', 
                      nullable: true, 
                      description: 'Nomor Kontak (opsional)' 
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Registrasi berhasil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { 
                        type: 'string', 
                        description: 'JWT token untuk autentikasi',
                        example: 'eyJhbGciOiJIUzI1NiIs...'
                      },
                      user: { 
                        $ref: '#/components/schemas/UserResponse'
                      }
                    }
                  },
                  example: {
                    token: 'eyJhbGciOiJIUzI1NiIs...',
                    user: {
                      id: '123',
                      email: 'budi.santoso@email.com',
                      name: null,
                      businessName: 'Budi Santoso',
                      businessOwner: 'Budi Santoso',
                      phoneNumber: '+628123456789'
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Input tidak valid atau email sudah terdaftar',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    status: 'error',
                    message: 'Email sudah terdaftar',
                    code: 400
                  }
                }
              }
            }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login pengguna',
          description: 'Login menggunakan email dan password untuk mendapatkan token JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { 
                      type: 'string', 
                      format: 'email', 
                      example: 'budi.santoso@email.com',
                      description: 'Email yang terdaftar'
                    },
                    password: { 
                      type: 'string', 
                      example: '123456',
                      description: 'Password akun'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login berhasil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { 
                        type: 'string', 
                        description: 'JWT token untuk autentikasi'
                      },
                      user: { 
                        $ref: '#/components/schemas/UserResponse'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Email atau password salah',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    status: 'error',
                    message: 'Email atau password salah',
                    code: 401
                  }
                }
              }
            }
          }
        }
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Mendapatkan data pengguna saat ini',
          description: 'Mengambil data pengguna yang sedang login berdasarkan token JWT',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Data pengguna berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    status: 'error',
                    message: 'Token tidak valid',
                    code: 401
                  }
                }
              }
            }
          }
        }
      },
      '/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Update profil pengguna',
          description: 'Memperbarui informasi profil dan bisnis pengguna',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { 
                      type: 'string', 
                      nullable: true, 
                      description: 'Nama pengguna' 
                    },
                    businessName: { 
                      type: 'string', 
                      nullable: true, 
                      description: 'Nama Bisnis' 
                    },
                    businessOwner: { 
                      type: 'string', 
                      nullable: true, 
                      description: 'Nama Pemilik Bisnis' 
                    },
                    phoneNumber: { 
                      type: 'string', 
                      nullable: true, 
                      description: 'Nomor Kontak' 
                    }
                  }
                },
                example: {
                  businessName: 'Budi Santoso',
                  businessOwner: 'Budi Santoso',
                  phoneNumber: '+628123456789'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profil berhasil diupdate',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/reports/income': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan pemasukan',
          description: 'Mendapatkan laporan pemasukan dengan filter kategori',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'category',
              in: 'query',
              description: 'Filter berdasarkan kategori pemasukan',
              required: false,
              schema: {
                type: 'string',
                enum: ['Penjualan Produk', 'Investasi Masuk', 'Biaya Konsultasi', 'Pendapatan Sewa', 'Lainnya']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Laporan pemasukan berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'number',
                        description: 'Total pemasukan',
                        example: 15000000
                      },
                      transactions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: '123' },
                            name: { type: 'string', example: 'Penjualan Produk A' },
                            description: { 
                              type: 'string', 
                              nullable: true, 
                              example: 'Penjualan batch pertama' 
                            },
                            amount: { type: 'number', example: 5000000 },
                            category: { 
                              type: 'string', 
                              example: 'Penjualan Produk',
                              enum: ['Penjualan Produk', 'Investasi Masuk', 'Biaya Konsultasi', 'Pendapatan Sewa', 'Lainnya']
                            }
                          }
                        }
                      },
                      summary: {
                        type: 'object',
                        description: 'Ringkasan pemasukan per kategori',
                        properties: {
                          'Penjualan Produk': { type: 'number', example: 8000000 },
                          'Investasi Masuk': { type: 'number', example: 3000000 },
                          'Biaya Konsultasi': { type: 'number', example: 2000000 },
                          'Pendapatan Sewa': { type: 'number', example: 1500000 },
                          'Lainnya': { type: 'number', example: 500000 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/reports/expense': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan pengeluaran',
          description: 'Mendapatkan laporan pengeluaran dengan filter kategori',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'category',
              in: 'query',
              description: 'Filter berdasarkan kategori pengeluaran',
              required: false,
              schema: {
                type: 'string',
                enum: ['Operasional', 'Gaji Karyawan', 'Transportasi', 'Pembelian Kebutuhan', 'Lainnya']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Laporan pengeluaran berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'number',
                        description: 'Total pengeluaran',
                        example: 12000000
                      },
                      transactions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: '124' },
                            name: { type: 'string', example: 'Pembayaran Gaji' },
                            description: { 
                              type: 'string', 
                              nullable: true, 
                              example: 'Gaji bulan Januari' 
                            },
                            amount: { type: 'number', example: 4000000 },
                            category: { 
                              type: 'string', 
                              example: 'Gaji Karyawan',
                              enum: ['Operasional', 'Gaji Karyawan', 'Transportasi', 'Pembelian Kebutuhan', 'Lainnya']
                            }
                          }
                        }
                      },
                      summary: {
                        type: 'object',
                        description: 'Ringkasan pengeluaran per kategori',
                        properties: {
                          'Operasional': { type: 'number', example: 3000000 },
                          'Gaji Karyawan': { type: 'number', example: 4000000 },
                          'Transportasi': { type: 'number', example: 1000000 },
                          'Pembelian Kebutuhan': { type: 'number', example: 3500000 },
                          'Lainnya': { type: 'number', example: 500000 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/transactions': {
        get: {
          tags: ['Transactions'],
          summary: 'Mendapatkan daftar transaksi',
          description: 'Mengambil daftar transaksi dengan filter opsional',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
              description: 'Filter berdasarkan tipe transaksi'
            },
            {
              name: 'startDate',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Tanggal awal'
            },
            {
              name: 'endDate',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Tanggal akhir'
            }
          ],
          responses: {
            '200': {
              description: 'Daftar transaksi berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'number',
                        description: 'Total transaksi',
                        example: 10
                      },
                      transactions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: '123' },
                            amount: { type: 'number', example: 1000000 },
                            name: { type: 'string', example: 'Penjualan Produk A' },
                            description: { 
                              type: 'string', 
                              nullable: true, 
                              example: 'Penjualan batch #123 ke PT XYZ' 
                            },
                            date: { type: 'string', format: 'date-time', example: '2024-03-15T00:00:00.000Z' },
                            type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
                            categoryId: { type: 'string', example: '456' }
                          }
                        }
                      },
                      summary: {
                        type: 'object',
                        description: 'Ringkasan transaksi per kategori',
                        properties: {
                          'INCOME': { type: 'number', example: 8000000 },
                          'EXPENSE': { type: 'number', example: 2000000 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Transactions'],
          summary: 'Membuat transaksi baru',
          description: 'Membuat transaksi baru dengan data yang diberikan',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'amount', 'date', 'categoryId', 'name'],
                  properties: {
                    type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
                    amount: { type: 'number', minimum: 0, example: 1000000 },
                    date: { type: 'string', format: 'date-time', example: '2024-03-15T00:00:00.000Z' },
                    categoryId: { type: 'string', example: '456' },
                    name: { type: 'string', example: 'Penjualan Produk A', description: 'Nama transaksi' },
                    description: { type: 'string', example: 'Penjualan batch #123 ke PT XYZ', description: 'Deskripsi detail transaksi (opsional)' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Transaksi berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: '123' },
                      amount: { type: 'number', example: 1000000 },
                      name: { type: 'string', example: 'Penjualan Produk A' },
                      description: { type: 'string', example: 'Penjualan batch #123 ke PT XYZ' },
                      date: { type: 'string', format: 'date-time', example: '2024-03-15T00:00:00.000Z' },
                      type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
                      categoryId: { type: 'string', example: '456' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Mendapatkan daftar kategori',
          description: 'Mengambil daftar kategori dengan filter tipe (income/expense)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
              description: 'Filter berdasarkan tipe kategori'
            }
          ],
          responses: {
            '200': {
              description: 'Daftar kategori berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'number',
                        description: 'Total kategori',
                        example: 2
                      },
                      categories: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: '456' },
                            name: { type: 'string', example: 'Penjualan Produk' },
                            type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' }
                          }
                        }
                      },
                      summary: {
                        type: 'object',
                        description: 'Ringkasan kategori per tipe',
                        properties: {
                          'INCOME': { type: 'number', example: 1 },
                          'EXPENSE': { type: 'number', example: 1 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/categories/income': {
        get: {
          tags: ['Categories'],
          summary: 'Daftar kategori pemasukan',
          description: 'Mendapatkan daftar kategori default untuk pemasukan',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar kategori pemasukan berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      categories: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: ['Penjualan Produk', 'Investasi Masuk', 'Biaya Konsultasi', 'Pendapatan Sewa', 'Lainnya'],
                        description: 'Daftar kategori default untuk pemasukan'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/categories/expense': {
        get: {
          tags: ['Categories'],
          summary: 'Daftar kategori pengeluaran',
          description: 'Mendapatkan daftar kategori default untuk pengeluaran',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar kategori pengeluaran berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      categories: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: ['Operasional', 'Gaji Karyawan', 'Transportasi', 'Pembelian Kebutuhan', 'Lainnya'],
                        description: 'Daftar kategori default untuk pengeluaran'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/reports/monthly': {
        get: {
          tags: ['Reports'],
          summary: 'Mendapatkan laporan bulanan',
          description: 'Mengambil laporan keuangan bulanan dengan filter bulan dan tahun',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'year',
              in: 'query',
              required: true,
              schema: { type: 'integer', example: 2024 },
              description: 'Tahun laporan'
            },
            {
              name: 'month',
              in: 'query',
              required: true,
              schema: { type: 'integer', minimum: 1, maximum: 12, example: 3 },
              description: 'Bulan laporan (1-12)'
            }
          ],
          responses: {
            '200': {
              description: 'Laporan bulanan berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalIncome: { type: 'number', example: 5000000 },
                      totalExpense: { type: 'number', example: 3000000 },
                      year: { type: 'integer', example: 2024 },
                      month: { type: 'integer', example: 3 }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/account': {
        put: {
          tags: ['Auth'],
          summary: 'Update profil pengguna',
          description: 'Memperbarui nama, email, nama bisnis, pemilik, dan nomor telepon pengguna',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', nullable: true, description: 'Nama pengguna' },
                    businessName: { type: 'string', nullable: true, description: 'Nama Bisnis' },
                    businessOwner: { type: 'string', nullable: true, description: 'Nama Pemilik Bisnis' },
                    email: { type: 'string', format: 'email', nullable: true, description: 'Email pengguna' },
                    phoneNumber: { type: 'string', nullable: true, description: 'Nomor Kontak' }
                  }
                },
                example: {
                  businessName: 'Budi Santoso',
                  businessOwner: 'Budi Santoso',
                  email: 'budi.santoso@email.com',
                  phoneNumber: '+628123456789'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profil berhasil diupdate',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' }
                }
              }
            },
            '400': {
              description: 'Email sudah terdaftar',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { status: 'error', message: 'Email sudah terdaftar', code: 400 }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Auth'],
          summary: 'Hapus akun pengguna',
          description: 'Menghapus akun pengguna yang sedang login',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Akun berhasil dihapus',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'Akun berhasil dihapus' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/account/password': {
        put: {
          tags: ['Auth'],
          summary: 'Ganti password pengguna',
          description: 'Mengganti password pengguna dengan password lama dan baru',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['oldPassword', 'newPassword'],
                  properties: {
                    oldPassword: { type: 'string', minLength: 6, description: 'Password lama' },
                    newPassword: { type: 'string', minLength: 6, description: 'Password baru' }
                  }
                },
                example: {
                  oldPassword: '123456',
                  newPassword: 'abcdef'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Password berhasil diubah',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'Password berhasil diubah' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Password lama salah',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { status: 'error', message: 'Password lama salah', code: 400 }
                }
              }
            },
            '401': {
              description: 'Token tidak valid atau kadaluarsa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      }
    }
  }; 