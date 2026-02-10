"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

type ActionResult =
  | { success: true; message?: string }
  | { error: string };

type UploadResult = {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors?: string[];
};

export async function savePollingStationAction(formData: FormData): Promise<ActionResult> {
  const stationId = formData.get("stationId")?.toString().trim() ?? null;
  const name = formData.get("name")?.toString().trim() ?? "";
  const county = formData.get("county")?.toString().trim() ?? "";
  const subCounty = formData.get("subCounty")?.toString().trim() ?? "";
  const ward = formData.get("ward")?.toString().trim() ?? "";
  const votesRaw = formData.get("votes")?.toString().trim() ?? "0";
  const votes = Number(votesRaw);

  if (!stationId) {
    return { error: "Polling Station ID is required" };
  }

  if (!name || !county || !subCounty || !ward) {
    return { error: "All required fields must be filled." };
  }

  if (Number.isNaN(votes) || votes < 0) {
    return { error: "Votes must be a valid non-negative number" };
  }

  try {
    const existing = await prisma.pollingStation.findUnique({
      where: { id: stationId },
      select: { id: true },
    });

    if (existing) {
      await prisma.pollingStation.update({
        where: { id: stationId },
        data: { name, county, subCounty, ward, votes },
      });
    } else {
      await prisma.pollingStation.create({
        data: {
          id: stationId,
          name,
          county,
          subCounty,
          ward,
          votes,
        },
      });
    }

    revalidatePath("/polling-stations");
    return { success: true };
  } catch (error) {
    console.error("Save polling station error:", error);
    return {
      error: stationId
        ? "Failed to update polling station."
        : "Failed to add polling station.",
    };
  }
}

export async function uploadPollingStationsAction(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "No file selected",
      created: 0,
      updated: 0,
    };
  }

  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
  const isCsv = fileName.endsWith(".csv");

  if (!isExcel && !isCsv) {
    return {
      success: false,
      message: "Only .csv, .xlsx or .xls files are allowed",
      created: 0,
      updated: 0,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let rows: unknown[][] = [];

    if (isCsv) {
      const text = buffer.toString("utf-8");
      rows = text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => line.split(",").map((cell) => cell.trim()));
    } else {
      // Excel parsing
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No sheet found in workbook");
      }
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as unknown[][];
    }

    if (rows.length < 2) {
      return {
        success: false,
        message: "File is empty or missing header row",
        created: 0,
        updated: 0,
      };
    }

    // headers: string[]
    const headers = (rows[0] as string[]).map((h) =>
      h?.toString().trim().toLowerCase().replace(/\s+/g, "") ?? "",
    );

    const required = ["stationid", "name", "county", "subcounty", "ward"] as const;

    for (const req of required) {
      if (!headers.includes(req)) {
        return {
          success: false,
          message: `Missing required column: "${req}" (case insensitive, no spaces in header)`,
          created: 0,
          updated: 0,
        };
      }
    }

    const created: string[] = [];
    const updated: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (row.length < headers.length) continue;

      const record: Record<string, string> = {};
      headers.forEach((key, idx) => {
        const value = row[idx];
        record[key] = value != null ? String(value).trim() : "";
      });

      const id = record["stationid"];
      const name = record["name"];
      const county = record["county"];
      const subCounty = record["subcounty"];
      const ward = record["ward"];
      const votes = Number(record["votes"] || "0");

      if (!id || !name || !county || !subCounty || !ward) {
        errors.push(`Row ${i + 1}: Missing one or more required fields`);
        continue;
      }

      if (Number.isNaN(votes) || votes < 0) {
        errors.push(`Row ${i + 1}: Invalid votes value`);
        continue;
      }

      try {
        const exists = await prisma.pollingStation.findUnique({
          where: { id },
          select: { id: true },
        });

        if (exists) {
          await prisma.pollingStation.update({
            where: { id },
            data: { name, county, subCounty, ward, votes },
          });
          updated.push(id);
        } else {
          await prisma.pollingStation.create({
            data: { id, name, county, subCounty, ward, votes },
          });
          created.push(id);
        }
      } catch (err) {
        console.error(`Row ${i + 1} failed:`, err);
        errors.push(`Row ${i + 1}: Failed to save (ID: ${id})`);
      }
    }

    revalidatePath("/polling-stations");

    const total = created.length + updated.length;

    return {
      success: true,
      message:
        total > 0
          ? `Processed ${total} stations (${created.length} new, ${updated.length} updated)`
          : "No valid rows found",
      created: created.length,
      updated: updated.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    console.error("Upload processing error:", err);
    return {
      success: false,
      message: "Failed to read/process the file. Check format and try again.",
      created: 0,
      updated: 0,
    };
  }
}

export async function deletePollingStationAction(stationId: string): Promise<ActionResult> {
  try {
    await prisma.pollingStation.delete({ where: { id: stationId } });
    revalidatePath("/polling-stations");
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { error: "Failed to delete polling station" };
  }
}