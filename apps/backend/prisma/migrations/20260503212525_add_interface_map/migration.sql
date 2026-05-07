-- CreateTable: interface_page_snapshots
CREATE TABLE "interface_page_snapshots" (
    "id"              TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "url"             TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "state_label"     TEXT NOT NULL DEFAULT 'Default',
    "framework"       TEXT NOT NULL DEFAULT 'unknown',
    "element_count"   INTEGER NOT NULL DEFAULT 0,
    "annotated_count" INTEGER NOT NULL DEFAULT 0,
    "captured_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active"       BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "interface_page_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: interface_elements
CREATE TABLE "interface_elements" (
    "id"                  TEXT NOT NULL,
    "snapshot_id"         TEXT NOT NULL,
    "tag"                 TEXT NOT NULL,
    "selector"            TEXT NOT NULL,
    "text"                TEXT NOT NULL DEFAULT '',
    "element_type"        TEXT NOT NULL DEFAULT 'unknown',
    "input_type"          TEXT,
    "aria_label"          TEXT,
    "placeholder"         TEXT,
    "name"                TEXT,
    "data_test_id"        TEXT,
    "role"                TEXT,
    "classes"             TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rect"                JSONB NOT NULL DEFAULT '{}',
    "custom_label"        TEXT,
    "custom_description"  TEXT,
    "business_rule"       TEXT,
    "is_sensitive"        BOOLEAN NOT NULL DEFAULT false,
    "annotated_at"        TIMESTAMP(3),
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interface_elements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interface_page_snapshots_organization_id_idx" ON "interface_page_snapshots"("organization_id");
CREATE INDEX "interface_page_snapshots_organization_id_url_idx" ON "interface_page_snapshots"("organization_id", "url");
CREATE INDEX "interface_elements_snapshot_id_idx" ON "interface_elements"("snapshot_id");
CREATE INDEX "interface_elements_snapshot_id_selector_idx" ON "interface_elements"("snapshot_id", "selector");

-- AddForeignKey
ALTER TABLE "interface_page_snapshots" ADD CONSTRAINT "interface_page_snapshots_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interface_elements" ADD CONSTRAINT "interface_elements_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "interface_page_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
