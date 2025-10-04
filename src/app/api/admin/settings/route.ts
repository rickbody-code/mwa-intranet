import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { toInputJson } from "@/lib/prisma-json";

// Default wiki settings
const DEFAULT_SETTINGS = {
  'wiki.name': 'MWA Intranet Wiki',
  'wiki.description': 'Marsden Wealth Advisers Knowledge Base',
  'wiki.default_status': 'DRAFT',
  'wiki.max_file_size': 10,
  'security.require_auth': true,
  'security.enable_collaboration': false,
  'security.activity_logging': true,
  'security.version_control': true,
  'search.full_text_enabled': true,
  'search.search_attachments': true,
  'search.results_limit': 50,
  'storage.provider': 'replit-object-storage',
  'storage.quota_gb': 10,
  'notifications.email_enabled': false,
  'notifications.realtime_updates': true
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific setting
      const setting = await prisma.wikiSetting.findUnique({
        where: { key }
      });
      
      return NextResponse.json({
        key,
        value: setting?.value ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] ?? null
      });
    } else {
      // Get all settings
      const settings = await prisma.wikiSetting.findMany({
        orderBy: { key: 'asc' }
      });

      // Merge with defaults
      const allSettings: Record<string, any> = { ...DEFAULT_SETTINGS };
      
      settings.forEach((setting: any) => {
        allSettings[setting.key] = setting.value;
      });

      return NextResponse.json({ settings: allSettings });
    }

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin();

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const updates = [];

    // Process each setting
    for (const [key, value] of Object.entries(settings)) {
      // Validate setting key
      if (!key.includes('.') || !Object.keys(DEFAULT_SETTINGS).includes(key)) {
        continue; // Skip invalid keys
      }

      updates.push(
        prisma.wikiSetting.upsert({
          where: { key },
          update: {
            value: toInputJson(value as Prisma.JsonValue),
            updatedBy: adminUser.id
          },
          create: {
            key,
            value: toInputJson(value as Prisma.JsonValue),
            updatedBy: adminUser.id
          }
        })
      );
    }

    // Execute all updates in transaction
    await prisma.$transaction(updates);

    // Log activity
    await prisma.activityLog.create({
      data: {
        actorId: adminUser.id,
        type: 'SETTINGS_UPDATE',
        data: { 
          adminAction: true,
          action: 'settings.updated',
          settingsKeys: Object.keys(settings)
        } as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${Object.keys(settings).length} setting(s)`,
      updatedKeys: Object.keys(settings)
    });

  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const adminUser = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Delete setting (will revert to default)
    await prisma.wikiSetting.delete({
      where: { key }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        actorId: adminUser.id,
        type: 'DELETE',
        data: { 
          adminAction: true,
          action: 'settings.reset',
          settingKey: key
        } as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Setting '${key}' reset to default`,
      defaultValue: DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]
    });

  } catch (error) {
    console.error('Settings delete error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}