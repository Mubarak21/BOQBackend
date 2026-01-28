import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, FindManyOptions } from "typeorm";
import { Inventory, InventoryCategory } from "../entities/inventory.entity";
import { User, UserRole } from "../entities/user.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { InventoryQueryDto } from "./dto/inventory-query.dto";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as xml2js from "xml2js";
import * as textract from "textract";

export interface DocumentParseResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  items: Inventory[];
  errors: string[];
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Create a new inventory item
   */
  async create(
    createInventoryDto: CreateInventoryDto,
    userId: string,
    pictureFile?: Express.Multer.File,
    invoiceFile?: Express.Multer.File
  ): Promise<Inventory> {
    let pictureUrl: string | null = null;
    let invoiceUrl: string | null = null;

    // Handle picture upload (required)
    if (pictureFile) {
      const uploadDir = path.join(
        process.cwd(),
        "uploads",
        "inventory",
        "pictures"
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${pictureFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, pictureFile.buffer);
      pictureUrl = `/uploads/inventory/pictures/${fileName}`;
    }

    // Handle invoice upload (optional)
    if (invoiceFile) {
      const uploadDir = path.join(
        process.cwd(),
        "uploads",
        "inventory",
        "invoices"
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${invoiceFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, invoiceFile.buffer);
      invoiceUrl = `/uploads/inventory/invoices/${fileName}`;
    }

    // Handle supplier - convert string to supplierId if needed
    let supplierId: string | null = null;
    if (createInventoryDto.supplier) {
      // For now, supplier is stored as string in DTO but entity uses relation
      // This will need to be updated to create/find Supplier entity
      // For now, we'll skip supplier assignment to avoid errors
      supplierId = null;
    }

    const { supplier, supplier_contact, ...inventoryData } = createInventoryDto;
    const inventory = this.inventoryRepository.create({
      ...inventoryData,
      supplierId,
      picture_url: pictureUrl,
      invoice_url: invoiceUrl,
      created_by: userId,
    });

    return this.inventoryRepository.save(inventory);
  }

  /**
   * Get all inventory items with filtering and pagination
   * 
   * IMPORTANT: Filters are applied BEFORE pagination to ensure:
   * - All filter criteria are applied to the entire dataset
   * - Pagination only returns items that match the filters
   * - The total count reflects the filtered dataset, not all items
   */
  async findAll(query: InventoryQueryDto): Promise<{
    items: Inventory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      supplier,
      is_active,
      low_stock,
      sortBy = "name",
      sortOrder = "ASC",
    } = query;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder("inventory")
      .leftJoinAndSelect("inventory.creator", "creator")
      .leftJoinAndSelect("inventory.supplier", "supplier");

    // Apply filters FIRST - this ensures filters work correctly with pagination
    // All filters are applied to the entire dataset before pagination
    if (search) {
      queryBuilder.andWhere(
        "(inventory.name ILIKE :search OR inventory.description ILIKE :search OR inventory.brand ILIKE :search OR inventory.model ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere("inventory.category = :category", { category });
    }

    if (supplier) {
      queryBuilder.andWhere("supplier.name ILIKE :supplier", {
        supplier: `%${supplier}%`,
      });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere("inventory.is_active = :is_active", { is_active });
    }

    if (low_stock) {
      queryBuilder.andWhere(
        "inventory.quantity_available <= inventory.minimum_stock"
      );
    }

    // Apply sorting - validate sortBy to prevent SQL injection
    const allowedSortFields = [
      'name',
      'category',
      'quantity_available',
      'unit_price',
      'created_at',
      'updated_at',
      'supplier',
      'is_active',
    ];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    // Handle supplier sorting - need to join supplier relation
    if (validSortBy === 'supplier') {
      queryBuilder.orderBy("supplier.name", sortOrder);
    } else {
      queryBuilder.orderBy(`inventory.${validSortBy}`, sortOrder);
    }

    // Apply pagination LAST - after filters and sorting
    // This ensures pagination works on the filtered and sorted dataset
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // getManyAndCount() executes:
    // 1. COUNT query with all filters (no pagination) -> returns total count of filtered items
    // 2. SELECT query with all filters + pagination -> returns paginated items
    // The total reflects the filtered dataset, ensuring pagination works correctly with filters
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single inventory item by ID
   */
  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ["creator"],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return inventory;
  }

  /**
   * Update an inventory item
   */
  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    userId: string
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);

    // Get user to check role
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ["id", "role"],
    });

    // Check if user has permission to update (creator, admin, or finance manager)
    const isCreator = inventory.created_by === userId;
    const isAdmin = user?.role === UserRole.CONSULTANT;
    const isFinanceManager = user?.role === UserRole.FINANCE;

    if (!isCreator && !isAdmin && !isFinanceManager) {
      throw new ForbiddenException(
        "You don't have permission to update this inventory item"
      );
    }

    Object.assign(inventory, updateInventoryDto);
    return this.inventoryRepository.save(inventory);
  }

  /**
   * Delete an inventory item
   */
  async remove(id: string, userId: string): Promise<void> {
    const inventory = await this.findOne(id);

    // Get user to check role
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ["id", "role"],
    });

    // Check if user has permission to delete (creator, admin, or finance manager)
    const isCreator = inventory.created_by === userId;
    const isAdmin = user?.role === UserRole.CONSULTANT;
    const isFinanceManager = user?.role === UserRole.FINANCE;

    if (!isCreator && !isAdmin && !isFinanceManager) {
      throw new ForbiddenException(
        "You don't have permission to delete this inventory item"
      );
    }

    await this.inventoryRepository.remove(inventory);
  }

  /**
   * Process uploaded document and extract inventory data
   */
  async processInventoryDocument(
    file: Express.Multer.File,
    userId: string
  ): Promise<DocumentParseResult> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const result: DocumentParseResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      items: [],
      errors: [],
    };

    try {
      let parsedData: any[] = [];

      // Parse based on file type
      const fileExtension = file.originalname
        .toLowerCase()
        .substring(file.originalname.lastIndexOf("."));

      if (
        file.mimetype.includes("spreadsheet") ||
        file.mimetype.includes("excel") ||
        fileExtension === ".xlsx" ||
        fileExtension === ".xls"
      ) {
        parsedData = await this.parseExcelFile(file);
      } else if (file.mimetype.includes("csv") || fileExtension === ".csv") {
        parsedData = await this.parseCsvFile(file);
      } else if (
        file.mimetype === "application/pdf" ||
        fileExtension === ".pdf"
      ) {
        parsedData = await this.parsePdfFile(file);
      } else if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword" ||
        fileExtension === ".docx" ||
        fileExtension === ".doc"
      ) {
        parsedData = await this.parseWordFile(file);
      } else if (file.mimetype === "text/plain" || fileExtension === ".txt") {
        parsedData = await this.parseTextFile(file);
      } else if (
        file.mimetype === "application/json" ||
        fileExtension === ".json"
      ) {
        parsedData = await this.parseJsonFile(file);
      } else if (
        file.mimetype === "application/xml" ||
        file.mimetype === "text/xml" ||
        fileExtension === ".xml"
      ) {
        parsedData = await this.parseXmlFile(file);
      } else {
        throw new BadRequestException(
          "Unsupported file format. Please upload Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), Word (.doc, .docx), Text (.txt), JSON (.json), or XML (.xml) files."
        );
      }

      result.totalProcessed = parsedData.length;

      // Process each row
      for (const row of parsedData) {
        try {
          const inventoryItem = await this.createFromParsedRow(
            row,
            userId,
            file.originalname
          );
          result.items.push(inventoryItem);
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Row ${result.successful + result.failed}: ${error.message}`
          );
        }
      }

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to process document: ${error.message}`
      );
    }
  }

  /**
   * Parse Excel file
   */
  private async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1); // Skip header row
  }

  /**
   * Parse CSV file
   */
  private async parseCsvFile(file: Express.Multer.File): Promise<any[]> {
    const csvContent = file.buffer.toString();
    const lines = csvContent.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return Object.values(obj);
    });
  }

  /**
   * Parse PDF file
   */
  private async parsePdfFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const data = await pdfParse(file.buffer);
      const text = data.text;

      // Try to parse as table data - look for lines with multiple fields
      const lines = text.split("\n").filter((line) => line.trim());
      const dataLines = lines.filter((line) => {
        // Look for lines that have multiple fields separated by spaces/tabs
        const fields = line.trim().split(/\s{2,}|\t/);
        return fields.length >= 3; // At least name, unit, price
      });

      return dataLines.map((line) => {
        // Split by multiple spaces or tabs to separate fields
        const fields = line
          .trim()
          .split(/\s{2,}|\t/)
          .map((f) => f.trim());
        return fields;
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse PDF file: ${error.message}`
      );
    }
  }

  /**
   * Parse Word document (.doc, .docx)
   */
  private async parseWordFile(file: Express.Multer.File): Promise<any[]> {
    try {
      let text = "";

      if (file.originalname.endsWith(".docx")) {
        // Use mammoth for .docx files
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else {
        // Use textract for .doc files
        text = await new Promise((resolve, reject) => {
          textract.fromBufferWithMime(
            "application/msword",
            file.buffer,
            (error, extractedText) => {
              if (error) reject(error);
              else resolve(extractedText || "");
            }
          );
        });
      }

      // Parse the extracted text similar to PDF
      const lines = text.split("\n").filter((line) => line.trim());
      const dataLines = lines.filter((line) => {
        const fields = line.trim().split(/\s{2,}|\t/);
        return fields.length >= 3;
      });

      return dataLines.map((line) => {
        const fields = line
          .trim()
          .split(/\s{2,}|\t/)
          .map((f) => f.trim());
        return fields;
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse Word document: ${error.message}`
      );
    }
  }

  /**
   * Parse Text file (.txt)
   */
  private async parseTextFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const content = file.buffer.toString("utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      // Try different delimiters: comma, tab, pipe, semicolon
      const delimiters = [",", "\t", "|", ";"];
      let bestDelimiter = ",";
      let maxFields = 0;

      // Find the best delimiter
      for (const delimiter of delimiters) {
        const testLine = lines[1] || lines[0]; // Use second line if available (first might be header)
        const fields = testLine.split(delimiter);
        if (fields.length > maxFields) {
          maxFields = fields.length;
          bestDelimiter = delimiter;
        }
      }

      // Skip header row if it looks like a header
      const dataLines = lines.slice(1).length > 0 ? lines.slice(1) : lines;

      return dataLines.map((line) => {
        return line
          .split(bestDelimiter)
          .map((field) => field.trim().replace(/"/g, ""));
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse text file: ${error.message}`
      );
    }
  }

  /**
   * Parse JSON file
   */
  private async parseJsonFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const content = file.buffer.toString("utf-8");
      const jsonData = JSON.parse(content);

      // Handle different JSON structures
      let items = [];

      if (Array.isArray(jsonData)) {
        // Direct array of items
        items = jsonData;
      } else if (jsonData.items && Array.isArray(jsonData.items)) {
        // Object with items array
        items = jsonData.items;
      } else if (jsonData.inventory && Array.isArray(jsonData.inventory)) {
        // Object with inventory array
        items = jsonData.inventory;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        // Object with data array
        items = jsonData.data;
      } else {
        throw new BadRequestException(
          "JSON structure not supported. Expected an array of items or an object with items/inventory/data array."
        );
      }

      // Convert objects to arrays in expected order
      return items.map((item) => {
        if (typeof item === "object") {
          return [
            item.name || item.Name || "",
            item.description || item.Description || "",
            item.unit || item.Unit || "",
            item.unit_price || item.unitPrice || item.price || item.Price || "",
            item.category || item.Category || "",
            item.brand || item.Brand || "",
            item.model || item.Model || "",
            item.supplier || item.Supplier || "",
            item.quantity_available ||
              item.quantityAvailable ||
              item.quantity ||
              item.Quantity ||
              "",
            item.minimum_stock ||
              item.minimumStock ||
              item.minStock ||
              item.MinStock ||
              "",
          ];
        }
        return item;
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse JSON file: ${error.message}`
      );
    }
  }

  /**
   * Parse XML file
   */
  private async parseXmlFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const content = file.buffer.toString("utf-8");
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(content);

      // Find the array of items in the XML structure
      let items = [];

      // Common XML structures
      if (result.inventory && result.inventory.item) {
        items = Array.isArray(result.inventory.item)
          ? result.inventory.item
          : [result.inventory.item];
      } else if (result.items && result.items.item) {
        items = Array.isArray(result.items.item)
          ? result.items.item
          : [result.items.item];
      } else if (result.data && result.data.item) {
        items = Array.isArray(result.data.item)
          ? result.data.item
          : [result.data.item];
      } else if (result.root && result.root.item) {
        items = Array.isArray(result.root.item)
          ? result.root.item
          : [result.root.item];
      } else {
        // Try to find any array-like structure
        const findItems = (obj: any): any[] => {
          if (Array.isArray(obj)) return obj;
          if (typeof obj === "object") {
            for (const key in obj) {
              if (Array.isArray(obj[key])) return obj[key];
              const nested = findItems(obj[key]);
              if (nested.length > 0) return nested;
            }
          }
          return [];
        };
        items = findItems(result);
      }

      if (items.length === 0) {
        throw new BadRequestException(
          "No items found in XML structure. Expected <inventory>, <items>, <data>, or <root> with <item> elements."
        );
      }

      // Convert XML objects to arrays
      return items.map((item) => [
        item.name || item.Name || "",
        item.description || item.Description || "",
        item.unit || item.Unit || "",
        item.unit_price || item.unitPrice || item.price || item.Price || "",
        item.category || item.Category || "",
        item.brand || item.Brand || "",
        item.model || item.Model || "",
        item.supplier || item.Supplier || "",
        item.quantity_available ||
          item.quantityAvailable ||
          item.quantity ||
          item.Quantity ||
          "",
        item.minimum_stock ||
          item.minimumStock ||
          item.minStock ||
          item.MinStock ||
          "",
      ]);
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse XML file: ${error.message}`
      );
    }
  }

  /**
   * Create inventory item from parsed row data
   */
  private async createFromParsedRow(
    row: any[],
    userId: string,
    sourceDocument: string
  ): Promise<Inventory> {
    // Try to map common column patterns
    const [
      name,
      description,
      unit,
      unitPrice,
      category,
      brand,
      model,
      supplier,
      quantityAvailable,
      minimumStock,
      ...rest
    ] = row;

    if (!name || !unit || !unitPrice) {
      throw new Error("Missing required fields: name, unit, or unit_price");
    }

    // Validate and convert unit price
    const price = parseFloat(unitPrice?.toString().replace(/[^\d.-]/g, ""));
    if (isNaN(price) || price < 0) {
      throw new Error("Invalid unit price");
    }

    // Try to map category
    let inventoryCategory = InventoryCategory.MATERIALS;
    if (category) {
      const categoryStr = category.toString().toLowerCase();
      const categoryMapping: { [key: string]: InventoryCategory } = {
        material: InventoryCategory.MATERIALS,
        materials: InventoryCategory.MATERIALS,
        equipment: InventoryCategory.EQUIPMENT,
        tool: InventoryCategory.TOOLS,
        tools: InventoryCategory.TOOLS,
        service: InventoryCategory.SERVICES,
        services: InventoryCategory.SERVICES,
        labor: InventoryCategory.LABOR,
        labour: InventoryCategory.LABOR,
      };
      inventoryCategory =
        categoryMapping[categoryStr] || InventoryCategory.OTHER;
    }

    const createDto: any = {
      name: name.toString().trim(),
      description: description?.toString().trim() || null,
      unit: unit.toString().trim(),
      unit_price: price,
      category: inventoryCategory,
      brand: brand?.toString().trim() || null,
      model: model?.toString().trim() || null,
      supplierId: null, // Supplier handling to be implemented separately
      quantity_available: quantityAvailable
        ? parseInt(quantityAvailable.toString()) || 0
        : 0,
      minimum_stock: minimumStock ? parseInt(minimumStock.toString()) || 0 : 0,
      is_active: true,
    };

    const inventory = this.inventoryRepository.create({
      ...createDto,
      created_by: userId,
      source_document: sourceDocument,
    }) as unknown as Inventory;

    return await this.inventoryRepository.save(inventory);
  }

  /**
   * Get inventory statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    activeItems: number;
    lowStockItems: number;
    totalValue: number;
    categoryCounts: { [key: string]: number };
  }> {
    const [totalItems, activeItems, lowStockItems, allItems] =
      await Promise.all([
        this.inventoryRepository.count(),
        this.inventoryRepository.count({ where: { is_active: true } }),
        this.inventoryRepository
          .createQueryBuilder("inventory")
          .where("inventory.quantity_available <= inventory.minimum_stock")
          .andWhere("inventory.is_active = true")
          .getCount(),
        this.inventoryRepository.find({ where: { is_active: true } }),
      ]);

    const totalValue = allItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity_available,
      0
    );

    const categoryCounts: { [key: string]: number } = {};
    Object.values(InventoryCategory).forEach((category) => {
      categoryCounts[category] = 0;
    });

    allItems.forEach((item) => {
      categoryCounts[item.category]++;
    });

    return {
      totalItems,
      activeItems,
      lowStockItems,
      totalValue,
      categoryCounts,
    };
  }
}
