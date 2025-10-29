from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@receiver(pre_save, sender=User)
def log_user_changes(sender, instance, **kwargs):
    """Log user role changes"""
    if instance.pk:  # If this is an update
        try:
            old_instance = User.objects.get(pk=instance.pk)
            if old_instance.role != instance.role:
                logger.info(f"User role change for {instance.username}: {old_instance.role} -> {instance.role}")
        except User.DoesNotExist:
            pass

@receiver(post_save, sender=User)
def verify_user_save(sender, instance, created, **kwargs):
    """Verify user changes were saved correctly"""
    if not created:  # Only for updates
        # Reload the user from DB to verify changes persisted
        fresh_instance = User.objects.get(pk=instance.pk)
        if fresh_instance.role != instance.role:
            logger.error(f"Role persistence error for {instance.username}: Expected {instance.role}, got {fresh_instance.role}")