<script setup>
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  Trash2,
  Pencil,
  Check,
  Package,
  LoaderCircle,
} from '@lucide/vue'
defineProps({ name: String, size: { type: Number, default: 18 } })
const icons = {
  bag: ShoppingBag,
  plus: Plus,
  minus: Minus,
  up: ArrowUp,
  external: ArrowUpRight,
  right: ArrowRight,
  left: ArrowLeft,
  search: Search,
  close: X,
  trash: Trash2,
  edit: Pencil,
  check: Check,
  package: Package,
  loading: LoaderCircle,
}
</script>
<template>
  <component
    :is="icons[name] || Package"
    :size="size"
    :stroke-width="1.8"
    aria-hidden="true"
    class="ui-icon"
  />
</template>
